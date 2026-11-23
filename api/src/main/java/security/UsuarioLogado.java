package security;

import entity.Usuario;
import exception.NaoAutorizadoException;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Quem está fazendo a requisição, lido do token JWT (o "subject" é o id do usuário).
 * É daqui, e nunca do corpo da requisição, que sai o dono dos dados: ninguém mexe nos dados de outra pessoa.
 */
@RequestScoped
public class UsuarioLogado {

    @Inject
    JsonWebToken token;

    public Usuario usuario() {
        if (token == null || token.getSubject() == null) {
            throw new NaoAutorizadoException("Faça login para continuar");
        }
        Usuario usuario = Usuario.findById(Long.valueOf(token.getSubject()));
        if (usuario == null) {
            throw new NaoAutorizadoException("Usuário não existe mais; faça login novamente");
        }
        return usuario;
    }
}
