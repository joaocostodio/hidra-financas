package security;

import jakarta.enterprise.context.ApplicationScoped;
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
 * </ul>
 * O nome tem que ser o mesmo de {@code mp.jwt.token.cookie} (application.properties), de onde o Quarkus lê o token.
 */
@ApplicationScoped
public class CookieSessao {

    public static final String NOME = "financas_sessao";

    @ConfigProperty(name = "smallrye.jwt.new-token.lifespan", defaultValue = "3600")
    long validadeSegundos;

    public NewCookie criar(String token) {
        return base().value(token).maxAge((int) validadeSegundos).build();
    }

    /** Cookie vencido com o mesmo nome: o navegador apaga o da sessão (logout). */
    public NewCookie apagar() {
        return base().value("").maxAge(0).expiry(Date.from(Instant.EPOCH)).build();
    }

    private static NewCookie.Builder base() {
        return new NewCookie.Builder(NOME)
                .path("/")
                .httpOnly(true)
                .sameSite(NewCookie.SameSite.STRICT);
    }
}
