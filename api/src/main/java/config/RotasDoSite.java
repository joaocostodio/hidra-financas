package config;

import io.quarkus.arc.profile.IfBuildProfile;
import io.vertx.ext.web.Router;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

import java.util.regex.Pattern;

/**
 * Na produção a própria API entrega o site (o Angular compilado fica em {@code META-INF/resources}, ver Dockerfile).
 * <p>
 * O Angular cuida das telas no navegador: abrir direto {@code /transacoes} ou apertar F5 nela precisa devolver o
 * {@code index.html}, e não um 404. Esta rota faz isso para tudo que não é API ({@code /api}) nem arquivo
 * (algo com extensão, como {@code main.js} ou {@code hidra.svg}).
 * <p>
 * Só existe no perfil de produção: no desenvolvimento quem entrega o site é o {@code ng serve}.
 */
@IfBuildProfile("prod")
@ApplicationScoped
public class RotasDoSite {

    private static final Pattern ARQUIVO = Pattern.compile(".*/[^/]+\\.[A-Za-z0-9]+$");

    void registrar(@Observes Router router) {
        router.get("/*").handler(ctx -> {
            String caminho = ctx.normalizedPath();
            if (caminho.equals("/") || caminho.equals("/api") || caminho.startsWith("/api/")
                    || ARQUIVO.matcher(caminho).matches()) {
                ctx.next();
            } else {
                ctx.reroute("/");
            }
        });
    }
}
