package entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.util.List;

/** Categoria de uma transação: "Alimentação", "Salário", "Transporte"... Cada usuário tem as suas. */
@Entity
public class Categoria extends PanacheEntity {

    @Column(nullable = false, length = 150)
    public String descricao;

    @ManyToOne(optional = false)
    public Usuario usuario;

    /** As que todo usuário novo já ganha ao se cadastrar. */
    public static final List<String> PADRAO =
            List.of("Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Salário", "Outros");

    public boolean emUso() {
        return Transacao.count("categoria", this) > 0;
    }

    public static List<Categoria> doUsuario(Usuario usuario) {
        return list("usuario = ?1 order by descricao", usuario);
    }

    public static Categoria doUsuario(Long id, Usuario usuario) {
        return find("id = ?1 and usuario = ?2", id, usuario).firstResult();
    }

    /** Já existe outra categoria do usuário com esse nome (sem diferenciar maiúsculas)? */
    public static boolean nomeEmUso(String descricao, Usuario usuario, Long ignorarId) {
        return count("usuario = ?1 and lower(descricao) = lower(?2) and id <> ?3",
                usuario, descricao, ignorarId == null ? -1L : ignorarId) > 0;
    }
}
