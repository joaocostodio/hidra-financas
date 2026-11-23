package config;

import org.eclipse.microprofile.config.spi.ConfigSource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Configura o banco a partir da variável de ambiente {@code DATABASE_URL}, no formato que o Neon (e o Render, o
 * Heroku...) entregam: {@code postgresql://usuario:senha@host/banco?sslmode=require}.
 * <p>
 * O Quarkus espera três propriedades separadas (URL JDBC, usuário e senha). Esta classe é uma fonte de configuração
 * do MicroProfile Config (registrada em {@code META-INF/services}) que faz a tradução. Sem {@code DATABASE_URL}
 * (no notebook e nos testes) ela não faz nada e vale o {@code application.properties}.
 * <p>
 * O endereço "-pooler" do Neon (PgBouncer) é trocado pela conexão direta, que funciona melhor com o Hibernate.
 */
public class BancoDaNuvem implements ConfigSource {

    /** Acima do application.properties (250) e abaixo das variáveis de ambiente (300). */
    private static final int PRIORIDADE = 275;

    private final Map<String, String> propriedades;

    public BancoDaNuvem() {
        this(System.getenv("DATABASE_URL"));
    }

    BancoDaNuvem(String databaseUrl) {
        this.propriedades = databaseUrl == null || databaseUrl.isBlank() ? Map.of() : traduzir(databaseUrl.trim());
    }

    static Map<String, String> traduzir(String databaseUrl) {
        URI uri = URI.create(databaseUrl);
        if (uri.getScheme() == null || !uri.getScheme().startsWith("postgres")) {
            throw new IllegalArgumentException("DATABASE_URL deve começar com postgresql://");
        }
        String host = uri.getHost().replace("-pooler.", ".");
        String porta = uri.getPort() > 0 ? ":" + uri.getPort() : "";
        String banco = uri.getPath() == null || uri.getPath().isBlank() ? "/postgres" : uri.getPath();

        Map<String, String> config = new HashMap<>();
        config.put("quarkus.datasource.jdbc.url", "jdbc:postgresql://" + host + porta + banco + "?sslmode=" + sslmode(uri));
        String usuario = uri.getRawUserInfo();
        if (usuario != null) {
            int doisPontos = usuario.indexOf(':');
            config.put("quarkus.datasource.username", decodificar(doisPontos < 0 ? usuario : usuario.substring(0, doisPontos)));
            if (doisPontos >= 0) {
                config.put("quarkus.datasource.password", decodificar(usuario.substring(doisPontos + 1)));
            }
        }
        return Map.copyOf(config);
    }

    /** Mantém o sslmode pedido (o Neon exige "require"); sem ele, usa "require" também. */
    private static String sslmode(URI uri) {
        String query = uri.getRawQuery();
        if (query != null) {
            for (String parte : query.split("&")) {
                if (parte.startsWith("sslmode=")) {
                    return decodificar(parte.substring("sslmode=".length()));
                }
            }
        }
        return "require";
    }

    private static String decodificar(String texto) {
        return URLDecoder.decode(texto, StandardCharsets.UTF_8);
    }

    @Override
    public Map<String, String> getProperties() {
        return propriedades;
    }

    @Override
    public Set<String> getPropertyNames() {
        return propriedades.keySet();
    }

    @Override
    public String getValue(String nome) {
        return propriedades.get(nome);
    }

    @Override
    public String getName() {
        return "DATABASE_URL";
    }

    @Override
    public int getOrdinal() {
        return PRIORIDADE;
    }
}
