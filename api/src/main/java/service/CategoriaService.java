package service;

import dto.Dtos.CategoriaForm;
import entity.Categoria;
import entity.Usuario;
import exception.NaoEncontradoException;
import exception.RegraException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

/** Cadastro de categorias (CRUD), sempre do usuário logado. */
@ApplicationScoped
public class CategoriaService {

    public List<Categoria> listar(Usuario usuario) {
        return Categoria.doUsuario(usuario);
    }

    public Categoria buscar(Long id, Usuario usuario) {
        Categoria categoria = Categoria.doUsuario(id, usuario);
        if (categoria == null) {
            throw new NaoEncontradoException("Categoria não encontrada");
        }
        return categoria;
    }

    @Transactional
    public Categoria criar(CategoriaForm form, Usuario usuario) {
        Categoria categoria = new Categoria();
        categoria.usuario = usuario;
        preencher(categoria, form, usuario);
        categoria.persist();
        return categoria;
    }

    @Transactional
    public Categoria atualizar(Long id, CategoriaForm form, Usuario usuario) {
        Categoria categoria = buscar(id, usuario);
        preencher(categoria, form, usuario);
        return categoria;
    }

    @Transactional
    public void excluir(Long id, Usuario usuario) {
        Categoria categoria = buscar(id, usuario);
        if (categoria.emUso()) {
            throw new RegraException("Essa categoria está em uso em transações e não pode ser excluída");
        }
        categoria.delete();
    }

    private static void preencher(Categoria categoria, CategoriaForm form, Usuario usuario) {
        String descricao = Validar.texto(form == null ? null : form.descricao(), "a descrição", 150);
        if (Categoria.nomeEmUso(descricao, usuario, categoria.id)) {
            throw new RegraException("Você já tem uma categoria chamada \"" + descricao + "\"");
        }
        categoria.descricao = descricao;
    }
}
