package entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Um gasto ou entrada que se repete todo mês no mesmo dia: aluguel, salário, academia...
 * O sistema lança a transação sozinho quando chega o dia (ver {@link #gerarAte(LocalDate)}).
 */
@Entity
public class TransacaoFixa extends PanacheEntity {

    @Column(nullable = false, length = 500)
    public String descricao;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal valor;

    /** "E" ou "S", igual à Transacao. */
    @Column(nullable = false, length = 1)
    public String tipo;

    /** Dia do mês em que acontece (1 a 31). Em meses mais curtos, vira o último dia. */
    @Column(nullable = false)
    public int dia;

    @ManyToOne(optional = false)
    public Conta conta;

    @ManyToOne(optional = false)
    public Categoria categoria;

    /** Próxima data em que a transação deve ser lançada. */
    @Column(nullable = false)
    public LocalDate proxima;

    /**
     * Lança as transações que já venceram até {@code hoje} (pode ser mais de uma, se a pessoa ficou
     * meses sem abrir o sistema) e avança a próxima data. Devolve quantas lançou.
     */
    public int gerarAte(LocalDate hoje) {
        int lancadas = 0;
        while (!proxima.isAfter(hoje)) {
            Transacao t = new Transacao();
            t.descricao = descricao;
            t.valor = valor;
            t.tipo = tipo;
            t.datatransacao = proxima;
            t.conta = conta;
            t.categoria = categoria;
            t.fixa = this;
            t.persist();
            lancadas++;
            proxima = noDia(YearMonth.from(proxima).plusMonths(1), dia);
        }
        return lancadas;
    }

    /** Dia {@code dia} do mês, ou o último dia se o mês for mais curto (31 em fevereiro → 28/29). */
    public static LocalDate noDia(YearMonth mes, int dia) {
        return mes.atDay(Math.min(dia, mes.lengthOfMonth()));
    }

    public static List<TransacaoFixa> doUsuario(Usuario usuario) {
        return list("conta.usuario = ?1 order by dia, descricao", usuario);
    }
}
