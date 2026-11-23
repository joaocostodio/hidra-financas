package controller;

import dto.Dtos.ResumoDto;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import security.UsuarioLogado;
import service.TransacaoService;

/** Dados da tela inicial: saldo por conta e geral. */
@Path("/resumo")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class ResumoController {

    @Inject
    TransacaoService service;

    @Inject
    UsuarioLogado logado;

    @GET
    public ResumoDto resumo() {
        return service.resumo(logado.usuario());
    }
}
