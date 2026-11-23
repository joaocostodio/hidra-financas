package controller;

import dto.Dtos.CadastroForm;
import dto.Dtos.LoginForm;
import dto.Dtos.UsuarioDto;
import entity.Usuario;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import security.CookieSessao;
import security.UsuarioLogado;
import service.AuthService;

/**
 * Cadastro, login e logout. O token JWT não vai no corpo da resposta: vai no cookie httpOnly.
 */
@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    @Inject
    AuthService auth;

    @Inject
    CookieSessao cookie;

    @Inject
    UsuarioLogado logado;

    /** Cabeçalhos da requisição atual: dizem se o acesso veio por HTTPS (túnel), para o cookie ganhar Secure. */
    @Context
    HttpHeaders cabecalhos;

    @POST
    @Path("/cadastro")
    public Response cadastrar(CadastroForm form) {
        Usuario usuario = auth.cadastrar(form);
        return comSessao(Response.status(Response.Status.CREATED), usuario);
    }

    @POST
    @Path("/login")
    public Response entrar(LoginForm form) {
        Usuario usuario = auth.entrar(form);
        return comSessao(Response.ok(), usuario);
    }

    @POST
    @Path("/sair")
    public Response sair() {
        return Response.noContent().cookie(cookie.apagar(cabecalhos)).build();
    }

    /** Quem está logado (o site usa para saber se a sessão ainda vale). */
    @GET
    @Path("/eu")
    @Authenticated
    public UsuarioDto eu() {
        return UsuarioDto.de(logado.usuario());
    }

    private Response comSessao(Response.ResponseBuilder resposta, Usuario usuario) {
        String token = auth.gerarToken(usuario);
        return resposta.cookie(cookie.criar(token, cabecalhos)).entity(UsuarioDto.de(usuario)).build();
    }
}
