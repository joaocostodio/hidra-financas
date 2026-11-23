package service;

import dto.Dtos.CadastroForm;
import dto.Dtos.LoginForm;
import entity.Categoria;
import entity.Usuario;
import exception.NaoAutorizadoException;
import exception.RegraException;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/** Cadastro, login e geração do token JWT. */
@ApplicationScoped
public class AuthService {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    @Transactional
    public Usuario cadastrar(CadastroForm form) {
        if (form == null) {
            throw new RegraException("Preencha o cadastro");
        }
        String nome = Validar.texto(form.nome(), "o nome", 120);
        String email = normalizarEmail(form.email());
        if (!EMAIL.matcher(email).matches()) {
            throw new RegraException("E-mail inválido");
        }
        validarSenha(form.senha());
        if (Usuario.porEmail(email) != null) {
            throw new RegraException("Já existe um cadastro com esse e-mail");
        }

        Usuario usuario = new Usuario();
        usuario.nome = nome;
        usuario.email = email;
        usuario.definirSenha(form.senha());
        usuario.persist();

        // Todo usuário novo já começa com algumas categorias (ele pode renomear, excluir e criar outras)
        for (String descricao : Categoria.PADRAO) {
            Categoria categoria = new Categoria();
            categoria.descricao = descricao;
            categoria.usuario = usuario;
            categoria.persist();
        }
        return usuario;
    }

    public Usuario entrar(LoginForm form) {
        String email = form == null ? "" : normalizarEmail(form.email());
        Usuario usuario = Usuario.porEmail(email);
        // Mesma mensagem para e-mail que não existe e senha errada: não revela quem tem cadastro
        if (usuario == null || !usuario.senhaConfere(form.senha())) {
            throw new NaoAutorizadoException("E-mail ou senha incorretos");
        }
        return usuario;
    }

    /** Token JWT assinado: o "subject" é o id do usuário. A validade (1 hora) vem do application.properties. */
    public String gerarToken(Usuario usuario) {
        return Jwt.subject(usuario.id.toString())
                .upn(usuario.email)
                .claim("nome", usuario.nome)
                .groups(Set.of("usuario"))
                .sign();
    }

    private static String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static void validarSenha(String senha) {
        if (senha == null || senha.length() < 8) {
            throw new RegraException("A senha precisa ter pelo menos 8 caracteres");
        }
        if (senha.length() > 72) {
            throw new RegraException("A senha pode ter no máximo 72 caracteres");
        }
        if (!senha.matches(".*[A-Za-z].*") || !senha.matches(".*[0-9].*")) {
            throw new RegraException("A senha precisa ter letras e números");
        }
    }
}
