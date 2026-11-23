package controller;

import dto.Dtos.ResumoDto;
import exception.RegraException;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import security.UsuarioLogado;
import service.TransacaoService;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;

/** Dados da tela inicial: saldo por conta e geral, e o resumo de um mês. */
@Path("/resumo")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class ResumoController {

    @Inject
    TransacaoService service;

    @Inject
    UsuarioLogado logado;

    /** GET /resumo?mes=2026-10 (sem o mes, é o mês atual). */
    @GET
    public ResumoDto resumo(@QueryParam("mes") String mes) {
        return service.resumo(logado.usuario(), lerMes(mes));
    }

    private static YearMonth lerMes(String mes) {
        if (mes == null || mes.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(mes.trim());
        } catch (DateTimeParseException e) {
            throw new RegraException("Mês inválido: use o formato 2026-11");
        }
    }
}
