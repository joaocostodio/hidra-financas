package security;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.NewCookie;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.util.Date;

/**
 * O token JWT vai num cookie, e não no JavaScript do site:
 * <ul>
 *   <li><b>HttpOnly</b>: o JavaScript da página não lê o cookie. Um script injetado (XSS) não rouba a sessão,
 *       como aconteceria com o token guardado no localStorage.</li>
 *   <li><b>SameSite=Strict</b>: o navegador não manda o cookie em requisições que vêm de outro site (CSRF).</li>
 *   <li><b>Secure</b> quando o acesso é por HTTPS (pelo túnel da Cloudflare): o cookie nunca trafega sem
 *       criptografia. No {@code http://localhost} ele fica sem essa marca, senão o navegador não o guardaria.</li>
 * </ul>
 * O nome tem que ser o mesmo de {@code mp.jwt.token.cookie} (application.properties), de onde o Quarkus lê o token.
 */
@ApplicationScoped
public class CookieSessao {

    public static final String NOME = "financas_sessao";

    @ConfigProperty(name = "smallrye.jwt.new-token.lifespan", defaultValue = "3600")
    long validadeSegundos;

    public NewCookie criar(String token, HttpHeaders cabecalhos) {
        return base(cabecalhos).value(token).maxAge((int) validadeSegundos).build();
    }

    /** Cookie vencido com o mesmo nome: o navegador apaga o da sessão (logout). */
    public NewCookie apagar(HttpHeaders cabecalhos) {
        return base(cabecalhos).value("").maxAge(0).expiry(Date.from(Instant.EPOCH)).build();
    }

    private static NewCookie.Builder base(HttpHeaders cabecalhos) {
        return new NewCookie.Builder(NOME)
                .path("/")
                .httpOnly(true)
                .secure(viaHttps(cabecalhos))
                .sameSite(NewCookie.SameSite.STRICT);
    }

    /**
     * A API fica atrás do ng serve (proxy) e, no túnel, atrás da Cloudflare: quem fala HTTPS com o navegador avisa
     * pelo cabeçalho X-Forwarded-Proto. Se alguém forjar esse cabeçalho, só muda a marca Secure do próprio cookie.
     */
    private static boolean viaHttps(HttpHeaders cabecalhos) {
        return cabecalhos != null && "https".equalsIgnoreCase(cabecalhos.getHeaderString("X-Forwarded-Proto"));
    }
}
