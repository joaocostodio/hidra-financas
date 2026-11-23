package config;

import org.eclipse.microprofile.config.spi.ConfigSource;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

/**
 * Chaves RSA que assinam e conferem o token de login (JWT) na nuvem, sem ninguém precisar copiar e colar chave.
 * <p>
 * Só age quando existe {@code DATABASE_URL} (Render + Neon). Ordem:
 * <ol>
 *   <li>Se {@code JWT_CHAVE_PRIVADA} e {@code JWT_CHAVE_PUBLICA} existem e são chaves válidas, usa essas.</li>
 *   <li>Senão, usa o par guardado na tabela {@code chave_jwt} do banco; na primeira vez gera um par novo
 *       (RSA 2048) e guarda. Assim o login continua valendo depois que o servidor reinicia.</li>
 * </ol>
 * No notebook e nos testes (sem {@code DATABASE_URL}) não faz nada: o Quarkus gera as chaves sozinho.
 * <p>
 * A chave privada fica no banco, protegida pela senha dele (que só existe no painel do Render).
 */
public class ChavesDaNuvem implements ConfigSource {

    static final String ASSINAR = "smallrye.jwt.sign.key";
    static final String CONFERIR = "mp.jwt.verify.publickey";
    private static final Set<String> NOMES = Set.of(ASSINAR, CONFERIR);
    private static final Logger LOG = Logger.getLogger(ChavesDaNuvem.class.getName());

    private final String databaseUrl;
    private final String privadaDoAmbiente;
    private final String publicaDoAmbiente;
    private volatile Map<String, String> chaves;

    public ChavesDaNuvem() {
        this(System.getenv("DATABASE_URL"), System.getenv("JWT_CHAVE_PRIVADA"), System.getenv("JWT_CHAVE_PUBLICA"));
    }

    ChavesDaNuvem(String databaseUrl, String privada, String publica) {
        this.databaseUrl = databaseUrl == null || databaseUrl.isBlank() ? null : databaseUrl.trim();
        this.privadaDoAmbiente = limpar(privada);
        this.publicaDoAmbiente = limpar(publica);
    }

    /** Só a parte Base64: tira linhas BEGIN/END, espaços e quebras de linha que vêm junto ao copiar. */
    static String limpar(String chave) {
        if (chave == null) {
            return null;
        }
        String base64 = chave.replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
        return base64.isEmpty() ? null : base64;
    }

    /** As duas formam um par RSA que o Java consegue ler? */
    static boolean validas(String privada, String publica) {
        if (privada == null || publica == null) {
            return false;
        }
        try {
            KeyFactory rsa = KeyFactory.getInstance("RSA");
            rsa.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privada)));
            rsa.generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(publica)));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    static String[] gerarPar() {
        try {
            KeyPairGenerator gerador = KeyPairGenerator.getInstance("RSA");
            gerador.initialize(2048);
            KeyPair par = gerador.generateKeyPair();
            Base64.Encoder b64 = Base64.getEncoder();
            return new String[]{b64.encodeToString(par.getPrivate().getEncoded()),
                    b64.encodeToString(par.getPublic().getEncoded())};
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private Map<String, String> carregar() {
        if (chaves == null) {
            synchronized (this) {
                if (chaves == null) {
                    chaves = escolher();
                }
            }
        }
        return chaves;
    }

    private Map<String, String> escolher() {
        if (databaseUrl == null) {
            return Map.of();
        }
        if (validas(privadaDoAmbiente, publicaDoAmbiente)) {
            return Map.of(ASSINAR, privadaDoAmbiente, CONFERIR, publicaDoAmbiente);
        }
        if (privadaDoAmbiente != null || publicaDoAmbiente != null) {
            LOG.warning("JWT_CHAVE_PRIVADA/JWT_CHAVE_PUBLICA inválidas; usando as chaves guardadas no banco");
        }
        String[] par = doBanco();
        return Map.of(ASSINAR, par[0], CONFERIR, par[1]);
    }

    /** Lê o par da tabela chave_jwt; se não houver, gera, guarda e lê de novo (quem guardar primeiro vale). */
    private String[] doBanco() {
        Map<String, String> banco = BancoDaNuvem.traduzir(databaseUrl);
        try (Connection c = DriverManager.getConnection(banco.get("quarkus.datasource.jdbc.url"),
                banco.get("quarkus.datasource.username"), banco.get("quarkus.datasource.password"))) {
            try (Statement s = c.createStatement()) {
                s.execute("create table if not exists chave_jwt "
                        + "(id int primary key, privada text not null, publica text not null)");
            }
            String[] par = ler(c);
            if (par == null) {
                String[] novo = gerarPar();
                try (PreparedStatement p = c.prepareStatement(
                        "insert into chave_jwt (id, privada, publica) values (1, ?, ?) on conflict (id) do nothing")) {
                    p.setString(1, novo[0]);
                    p.setString(2, novo[1]);
                    p.executeUpdate();
                }
                par = ler(c);
                LOG.info("Chaves do JWT geradas e guardadas no banco (tabela chave_jwt)");
            }
            return par;
        } catch (SQLException e) {
            throw new IllegalStateException("Não foi possível ler/guardar as chaves do JWT no banco", e);
        }
    }

    private static String[] ler(Connection c) throws SQLException {
        try (Statement s = c.createStatement();
             ResultSet r = s.executeQuery("select privada, publica from chave_jwt where id = 1")) {
            return r.next() ? new String[]{r.getString(1), r.getString(2)} : null;
        }
    }

    @Override
    public Map<String, String> getProperties() {
        return databaseUrl == null ? Map.of() : carregar();
    }

    @Override
    public Set<String> getPropertyNames() {
        return databaseUrl == null ? Set.of() : NOMES;
    }

    @Override
    public String getValue(String nome) {
        if (databaseUrl == null || !NOMES.contains(nome)) {
            return null;
        }
        return carregar().get(nome);
    }

    @Override
    public String getName() {
        return "chaves-jwt-da-nuvem";
    }

    @Override
    public int getOrdinal() {
        // Acima do application.properties (250), como o BancoDaNuvem
        return 275;
    }
}
