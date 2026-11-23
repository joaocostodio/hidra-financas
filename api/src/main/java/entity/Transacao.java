package entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Uma linha da "planilha": entrada (E) ou saída (S) de dinheiro numa conta.
 * Uma transferência são duas transações com o mesmo código: S na conta de origem e E na de destino.
 */
@Entity
public class Transacao extends PanacheEntity {

    public static final String ENTRADA = "E";
    public static final String SAIDA = "S";

    @Column(nullable = false, length = 500)
    public String descricao;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal valor;

    /** "E" = entrada (receita), "S" = saída (despesa). */
    @Column(nullable = false, length = 1)
    public String tipo;

    @Column(nullable = false)
    public LocalDate datatransacao;

    @ManyToOne(optional = false)
    public Conta conta;

    /** Obrigatória em receitas e despesas; nas transferências fica vazia. */
    @ManyToOne
    public Categoria categoria;

    /** Código que liga as duas pontas de uma transferência (nulo nas transações comuns). */
    @Column(length = 36)
    public String transferencia;

    /** Se foi lançada por um gasto/entrada fixo que se repete todo mês (nulo nas comuns). */
    @ManyToOne
    public TransacaoFixa fixa;

    public boolean ehTransferencia() {
        return transferencia != null;
    }

    /** Soma das entradas ou das saídas de uma conta. */
    public static BigDecimal somar(Conta conta, String tipo) {
        BigDecimal soma = getEntityManager()
                .createQuery("select sum(t.valor) from Transacao t where t.conta = :conta and t.tipo = :tipo",
                        BigDecimal.class)
                .setParameter("conta", conta)
                .setParameter("tipo", tipo)
                .getSingleResult();
        return soma == null ? BigDecimal.ZERO : soma;
    }
}
