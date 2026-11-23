package controller;

import dto.Dtos.FixaDto;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import security.UsuarioLogado;
import service.FixaService;

import java.util.List;

/**
 * Gastos e entradas fixos (que se repetem todo mês). Eles nascem ao lançar uma transação com
 * "repetir: true" (POST /transacoes); aqui dá para ver quais existem e parar de repetir.
 */
@Path("/fixas")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class FixaController {

    @Inject
    FixaService service;

    @Inject
    UsuarioLogado logado;

    @GET
    public List<FixaDto> listar() {
        return service.listar(logado.usuario()).stream().map(FixaDto::de).toList();
    }

    /** Para de repetir (as transações já lançadas continuam). */
    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id, logado.usuario());
        return Response.noContent().build();
    }
}
