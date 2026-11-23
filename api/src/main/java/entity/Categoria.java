package entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Categoria de uma transação: "Alimentação", "Salário", "Transporte"... Cada usuário tem as suas. */
@Entity
public class Categoria extends PanacheEntity {

    /** Ícone usado quando a categoria não tem um escolhido (uma etiqueta). */
    public static final String ICONE_PADRAO = "sell";

    @Column(nullable = false, length = 150)
    public String descricao;

    /** Nome do ícone (fonte Material Symbols), escolhido pelo usuário: "restaurant", "pets"... */
    @Column(length = 40)
    public String icone;

    @ManyToOne(optional = false)
    public Usuario usuario;

    /** As que todo usuário novo já ganha ao se cadastrar, cada uma com seu ícone. */
    public static final Map<String, String> PADRAO = padrao();

    private static Map<String, String> padrao() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("Alimentação", "restaurant");
        m.put("Moradia", "home");
        m.put("Transporte", "directions_car");
        m.put("Saúde", "medical_services");
        m.put("Lazer", "celebration");
        m.put("Salário", "work");
        m.put("Outros", "more_horiz");
        return m;
    }

    /** O ícone escolhido, ou a etiqueta padrão (categorias antigas não têm ícone). */
    public String iconeOuPadrao() {
        return icone == null || icone.isBlank() ? ICONE_PADRAO : icone;
    }

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
