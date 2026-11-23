package entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import org.mindrot.jbcrypt.BCrypt;

/**
 * Quem usa o sistema. Cada usuário só enxerga as próprias contas, categorias e transações.
 */
@Entity
public class Usuario extends PanacheEntity {

    @Column(nullable = false, length = 120)
    public String nome;

    @Column(nullable = false, unique = true, length = 150)
    public String email;

    /** Encapsulamento: a senha é privada e só é gravada como hash BCrypt, nunca o texto digitado. */
    @Column(nullable = false, length = 60)
    private String senhaHash;

    public void definirSenha(String senha) {
        this.senhaHash = BCrypt.hashpw(senha, BCrypt.gensalt());
    }

    public boolean senhaConfere(String senha) {
        return senha != null && senhaHash != null && BCrypt.checkpw(senha, senhaHash);
    }

    public static Usuario porEmail(String email) {
        return find("email", email).firstResult();
    }
}
