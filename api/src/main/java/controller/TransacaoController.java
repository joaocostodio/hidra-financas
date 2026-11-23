package controller;

import dto.Dtos.TransacaoDto;
import dto.Dtos.TransacaoForm;
import dto.Dtos.TransferenciaForm;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import security.UsuarioLogado;
import service.TransacaoService;

import java.util.List;

@Path("/transacoes")
@Authenticated
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class TransacaoController {

    @Inject
    TransacaoService service;

    @Inject
    UsuarioLogado logado;

    /** GET /transacoes?contaId=1&categoriaId=2&tipo=S (todos os filtros são opcionais). */
    @GET
    public List<TransacaoDto> listar(@QueryParam("contaId") Long contaId,
                                     @QueryParam("categoriaId") Long categoriaId,
                                     @QueryParam("tipo") String tipo) {
        return service.listar(logado.usuario(), contaId, categoriaId, tipo)
                .stream().map(TransacaoDto::de).toList();
    }

    @GET
    @Path("/{id}")
    public TransacaoDto buscar(@PathParam("id") Long id) {
        return TransacaoDto.de(service.buscar(id, logado.usuario()));
    }

    @POST
    public Response lancar(TransacaoForm form) {
        TransacaoDto transacao = TransacaoDto.de(service.lancar(form, logado.usuario()));
        return Response.status(Response.Status.CREATED).entity(transacao).build();
    }

    @PUT
    @Path("/{id}")
    public TransacaoDto atualizar(@PathParam("id") Long id, TransacaoForm form) {
        return TransacaoDto.de(service.atualizar(id, form, logado.usuario()));
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id, logado.usuario());
        return Response.noContent().build();
    }

    /** Transferência entre contas: responde as duas transações criadas (saída e entrada). */
    @POST
    @Path("/transferencia")
    public Response transferir(TransferenciaForm form) {
        List<TransacaoDto> pontas = service.transferir(form, logado.usuario())
                .stream().map(TransacaoDto::de).toList();
        return Response.status(Response.Status.CREATED).entity(pontas).build();
    }
}
