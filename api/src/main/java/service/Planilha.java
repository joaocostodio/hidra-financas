package service;

import entity.Transacao;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Monta o arquivo CSV das movimentações, do jeito que o Excel em português abre direto:
 * separador ";", vírgula nos centavos, data dd/MM/aaaa e o BOM do UTF-8 (para os acentos aparecerem certos).
 * As saídas vão com valor negativo: assim a soma da coluna Valor dá o saldo do período.
 */
public final class Planilha {

    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private Planilha() {
    }

    public static String csv(List<Transacao> transacoes) {
        StringBuilder csv = new StringBuilder("﻿");
        csv.append("Data;Descrição;Categoria;Conta;Tipo;Valor\r\n");
        for (Transacao t : transacoes) {
            BigDecimal valor = Transacao.SAIDA.equals(t.tipo) ? t.valor.negate() : t.valor;
            csv.append(t.datatransacao.format(DATA)).append(';')
                    .append(campo(t.descricao)).append(';')
                    .append(campo(t.categoria == null ? "Entre contas" : t.categoria.descricao)).append(';')
                    .append(campo(t.conta.descricao)).append(';')
                    .append(Transacao.ENTRADA.equals(t.tipo) ? "Entrou" : "Saiu").append(';')
                    .append(valor.toPlainString().replace('.', ','))
                    .append("\r\n");
        }
        return csv.toString();
    }

    /**
     * Texto entre aspas (aspas internas dobradas). Texto que começa com = + - @ ganha um apóstrofo na frente,
     * para o Excel não tratar como fórmula (proteção contra "CSV injection").
     */
    private static String campo(String texto) {
        String t = texto == null ? "" : texto;
        if (!t.isEmpty() && "=+-@".indexOf(t.charAt(0)) >= 0) {
            t = "'" + t;
        }
        return '"' + t.replace("\"", "\"\"") + '"';
    }
}
