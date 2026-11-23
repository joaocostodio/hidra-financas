package entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.math.BigDecimal;
import java.util.List;

/**
 * Uma conta do usuário: "Nubank", "Carteira", "Poupança"...
 * O sistema não guarda dinheiro, só anota: o saldo é calculado a partir das transações.
 */
@Entity
public class Conta extends PanacheEntity {

    @Column(nullable = false, length = 150)
    public String descricao;

    /** Quanto já tinha na conta quando ela foi cadastrada. */
    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal saldoInicial = BigDecimal.ZERO;

    @ManyToOne(optional = false)
    public Usuario usuario;

    /** Saldo = saldo inicial + entradas − saídas. */
    public BigDecimal saldo() {
        return saldoInicial
                .add(Transacao.somar(this, Transacao.ENTRADA))
                .subtract(Transacao.somar(this, Transacao.SAIDA));
    }

    /** Tem transações ou gastos fixos? (aí não pode ser excluída) */
    public boolean temTransacoes() {
        return Transacao.count("conta", this) > 0 || TransacaoFixa.count("conta", this) > 0;
    }

    public static List<Conta> doUsuario(Usuario usuario) {
        return list("usuario = ?1 order by descricao", usuario);
    }

    /** Só acha a conta se ela for do usuário: a conta de outra pessoa "não existe". */
    public static Conta doUsuario(Long id, Usuario usuario) {
        return find("id = ?1 and usuario = ?2", id, usuario).firstResult();
    }
}
