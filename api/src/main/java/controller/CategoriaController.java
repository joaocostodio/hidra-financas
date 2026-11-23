package controller;

import dto.Dtos.CategoriaDto;
import dto.Dtos.CategoriaForm;
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
import service.CategoriaService;

import java.util.List;

@Path("/categorias")
@Authenticated
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CategoriaController {

    @Inject
    CategoriaService service;

    @Inject
    UsuarioLogado logado;

    @GET
    public List<CategoriaDto> listar() {
        return service.listar(logado.usuario()).stream().map(CategoriaDto::de).toList();
    }

    @GET
    @Path("/{id}")
    public CategoriaDto buscar(@PathParam("id") Long id) {
        return CategoriaDto.de(service.buscar(id, logado.usuario()));
    }

    @POST
    public Response criar(CategoriaForm form) {
        CategoriaDto categoria = CategoriaDto.de(service.criar(form, logado.usuario()));
        return Response.status(Response.Status.CREATED).entity(categoria).build();
    }

    @PUT
    @Path("/{id}")
    public CategoriaDto atualizar(@PathParam("id") Long id, CategoriaForm form) {
        return CategoriaDto.de(service.atualizar(id, form, logado.usuario()));
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id, logado.usuario());
        return Response.noContent().build();
    }
}
