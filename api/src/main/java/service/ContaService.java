package service;

import dto.Dtos.ContaForm;
import entity.Conta;
import entity.Usuario;
import exception.NaoEncontradoException;
import exception.RegraException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

/** Cadastro de contas (CRUD), sempre do usuário logado. */
@ApplicationScoped
public class ContaService {

    public List<Conta> listar(Usuario usuario) {
        return Conta.doUsuario(usuario);
    }

    public Conta buscar(Long id, Usuario usuario) {
        Conta conta = Conta.doUsuario(id, usuario);
        if (conta == null) {
            throw new NaoEncontradoException("Conta não encontrada");
        }
        return conta;
    }

    @Transactional
    public Conta criar(ContaForm form, Usuario usuario) {
        Conta conta = new Conta();
        conta.usuario = usuario;
        preencher(conta, form);
        conta.persist();
        return conta;
    }

    @Transactional
    public Conta atualizar(Long id, ContaForm form, Usuario usuario) {
        Conta conta = buscar(id, usuario);
        preencher(conta, form);
        return conta;
    }

    @Transactional
    public void excluir(Long id, Usuario usuario) {
        Conta conta = buscar(id, usuario);
        if (conta.temTransacoes()) {
            throw new RegraException("Essa conta tem movimentações (ou gastos fixos). Exclua-os antes de excluir a conta");
        }
        conta.delete();
    }

    private static void preencher(Conta conta, ContaForm form) {
        if (form == null) {
            throw new RegraException("Preencha os dados da conta");
        }
        conta.descricao = Validar.texto(form.descricao(), "a descrição", 150);
        conta.saldoInicial = Validar.saldoInicial(form.saldoInicial());
    }
}
