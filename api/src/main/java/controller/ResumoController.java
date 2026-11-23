package controller;

import dto.Dtos.ResumoDto;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import security.UsuarioLogado;
import service.TransacaoService;

/** Dados da tela inicial: saldo por conta e geral, e o resumo de um mês. */
@Path("/resumo")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class ResumoController {

    @Inject
    TransacaoService service;

    @Inject
    UsuarioLogado logado;

    /** GET /resumo?mes=2026-10 (sem o mes, é o mês atual; formato errado = 422). */
    @GET
    public ResumoDto resumo(@QueryParam("mes") String mes) {
        return service.resumo(logado.usuario(), mes);
    }
}
