package service;

import exception.RegraException;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Validações usadas por mais de um service. */
final class Validar {

    private Validar() {
    }

    /** Texto obrigatório: tira espaços das pontas e confere o tamanho. */
    static String texto(String valor, String campo, int maximo) {
        String limpo = valor == null ? "" : valor.trim();
        if (limpo.isEmpty()) {
            throw new RegraException("Informe " + campo);
        }
        if (limpo.length() > maximo) {
            throw new RegraException(primeiraMaiuscula(campo) + " pode ter no máximo " + maximo + " caracteres");
        }
        return limpo;
    }

    /** Valor de dinheiro: maior que zero e com no máximo 2 casas decimais. */
    static BigDecimal valorPositivo(BigDecimal valor) {
        if (valor == null || valor.signum() <= 0) {
            throw new RegraException("O valor deve ser maior que zero");
        }
        return duasCasas(valor);
    }

    /** Saldo inicial: pode ser zero ou negativo (conta no cheque especial). */
    static BigDecimal saldoInicial(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO.setScale(2) : duasCasas(valor);
    }

    static LocalDate data(LocalDate data) {
        return data == null ? LocalDate.now() : data;
    }

    private static BigDecimal duasCasas(BigDecimal valor) {
        if (valor.stripTrailingZeros().scale() > 2) {
            throw new RegraException("Use no máximo 2 casas decimais (centavos)");
        }
        if (valor.abs().compareTo(new BigDecimal("9999999999.99")) > 0) {
            throw new RegraException("Valor muito alto");
        }
        return valor.setScale(2);
    }

    private static String primeiraMaiuscula(String s) {
        String semArtigo = s.replaceFirst("^(o|a|os|as) ", "");
        return Character.toUpperCase(semArtigo.charAt(0)) + semArtigo.substring(1);
    }
}
