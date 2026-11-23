package service;

import entity.Transacao;
import entity.TransacaoFixa;
import entity.Usuario;
import exception.NaoEncontradoException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Gastos e entradas fixos (aluguel, salário, academia...): o sistema lança sozinho todo mês.
 * Não precisa de tarefa agendada: sempre que a pessoa abre o início ou as movimentações, o sistema
 * lança o que já venceu ({@link #gerarPendentes}).
 */
@ApplicationScoped
public class FixaService {

    /** Cria o fixo a partir da transação que acabou de ser lançada: a próxima é no mês seguinte. */
    @Transactional
    public TransacaoFixa criarAPartirDe(Transacao t) {
        TransacaoFixa fixa = new TransacaoFixa();
        fixa.descricao = t.descricao;
        fixa.valor = t.valor;
        fixa.tipo = t.tipo;
        fixa.dia = t.datatransacao.getDayOfMonth();
        fixa.conta = t.conta;
        fixa.categoria = t.categoria;
        fixa.proxima = TransacaoFixa.noDia(YearMonth.from(t.datatransacao).plusMonths(1), fixa.dia);
        fixa.persist();
        t.fixa = fixa;
        return fixa;
    }

    /**
     * Lança, para o usuário, todos os fixos que já venceram até hoje.
     * As linhas ficam travadas (select ... for update) até o fim da transação: o início e as movimentações
     * costumam pedir isso ao mesmo tempo, e sem a trava os dois lançariam o mesmo fixo (ficaria duplicado).
     * Quem chega depois espera, relê a próxima data já avançada e não lança de novo.
     */
    @Transactional
    public int gerarPendentes(Usuario usuario) {
        LocalDate hoje = LocalDate.now();
        List<TransacaoFixa> vencidas = TransacaoFixa.find("conta.usuario = ?1 and proxima <= ?2", usuario, hoje)
                .withLock(LockModeType.PESSIMISTIC_WRITE)
                .list();
        return vencidas.stream().mapToInt(f -> f.gerarAte(hoje)).sum();
    }

    public List<TransacaoFixa> listar(Usuario usuario) {
        return TransacaoFixa.doUsuario(usuario);
    }

    /**
     * Para de repetir. As transações já lançadas continuam (são passado), só perdem a ligação com o fixo.
     */
    @Transactional
    public void excluir(Long id, Usuario usuario) {
        TransacaoFixa fixa = TransacaoFixa.find("id = ?1 and conta.usuario = ?2", id, usuario).firstResult();
        if (fixa == null) {
            throw new NaoEncontradoException("Gasto fixo não encontrado");
        }
        Transacao.update("fixa = null where fixa = ?1", fixa);
        fixa.delete();
    }
}
