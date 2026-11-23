package exception;

import dto.Dtos.Erro;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

/** Transforma as exceções das regras em respostas HTTP com corpo {"erro": "mensagem"}. */
public class TratadorDeErros {

    @ServerExceptionMapper
    public Response regra(RegraException e) {
        return resposta(422, e.getMessage());
    }

    @ServerExceptionMapper
    public Response naoEncontrado(NaoEncontradoException e) {
        return resposta(404, e.getMessage());
    }

    @ServerExceptionMapper
    public Response naoAutorizado(NaoAutorizadoException e) {
        return resposta(401, e.getMessage());
    }

    private static Response resposta(int status, String mensagem) {
        return Response.status(status).type(MediaType.APPLICATION_JSON).entity(new Erro(mensagem)).build();
    }
}
