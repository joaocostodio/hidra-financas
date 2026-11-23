package controller;

import dto.Dtos.ContaDto;
import dto.Dtos.ContaForm;
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
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import security.UsuarioLogado;
import service.ContaService;

import java.util.List;

@Path("/contas")
@Authenticated
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ContaController {

    @Inject
    ContaService service;

    @Inject
    UsuarioLogado logado;

    @GET
    public List<ContaDto> listar() {
        return service.listar(logado.usuario()).stream().map(ContaDto::de).toList();
    }

    @GET
    @Path("/{id}")
    public ContaDto buscar(@PathParam("id") Long id) {
        return ContaDto.de(service.buscar(id, logado.usuario()));
    }

    @POST
    public Response criar(ContaForm form) {
        ContaDto conta = ContaDto.de(service.criar(form, logado.usuario()));
        return Response.status(Response.Status.CREATED).entity(conta).build();
    }

    @PUT
    @Path("/{id}")
    public ContaDto atualizar(@PathParam("id") Long id, ContaForm form) {
        return ContaDto.de(service.atualizar(id, form, logado.usuario()));
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id, logado.usuario());
        return Response.noContent().build();
    }
}
