package service;

import dto.Dtos.ContaDto;
import dto.Dtos.GastoCategoriaDto;
import dto.Dtos.ResumoDto;
import dto.Dtos.TransacaoDto;
import dto.Dtos.TransacaoForm;
import dto.Dtos.TransferenciaForm;
import entity.Categoria;
import entity.Conta;
import entity.Transacao;
import entity.Usuario;
import exception.NaoEncontradoException;
import exception.RegraException;
import io.quarkus.panache.common.Parameters;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/** Lançamentos (receitas e despesas), filtros, transferência entre contas e o resumo da tela inicial. */
@ApplicationScoped
public class TransacaoService {

    @Inject
    ContaService contas;

    @Inject
    CategoriaService categorias;

    @Inject
    FixaService fixas;

    /**
     * Transações do usuário, das mais novas para as mais antigas.
     * Os filtros são opcionais: por conta, por categoria, por tipo (E/S), por mês ("2026-11") e por texto
     * na descrição. Antes de listar, lança os gastos/entradas fixos que já venceram.
     */
    public List<Transacao> listar(Usuario usuario, Long contaId, Long categoriaId, String tipo,
                                  String mes, String busca) {
        fixas.gerarPendentes(usuario);
        StringBuilder where = new StringBuilder("conta.usuario = :usuario");
        Parameters parametros = Parameters.with("usuario", usuario);
        YearMonth periodo = Validar.mes(mes);
        if (periodo != null) {
            where.append(" and datatransacao between :inicio and :fim");
            parametros.and("inicio", periodo.atDay(1)).and("fim", periodo.atEndOfMonth());
        }
        if (busca != null && !busca.isBlank()) {
            // Parâmetro (nunca texto do usuário concatenado na consulta); % e _ digitados valem como texto
            String termo = busca.trim().toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
            where.append(" and lower(descricao) like :busca escape '\\'");
            parametros.and("busca", "%" + termo + "%");
        }
        if (contaId != null) {
            where.append(" and conta.id = :conta");
            parametros.and("conta", contaId);
        }
        if (categoriaId != null) {
            where.append(" and categoria.id = :categoria");
            parametros.and("categoria", categoriaId);
        }
        if (tipo != null && !tipo.isBlank()) {
            where.append(" and tipo = :tipo");
            parametros.and("tipo", validarTipo(tipo));
        }
        return Transacao.list(where + " order by datatransacao desc, id desc", parametros);
    }

    public Transacao buscar(Long id, Usuario usuario) {
        Transacao transacao = Transacao.find("id = ?1 and conta.usuario = ?2", id, usuario).firstResult();
        if (transacao == null) {
            throw new NaoEncontradoException("Transação não encontrada");
        }
        return transacao;
    }

    /**
     * Lança uma receita (E) ou despesa (S). Com "repetir", também cria um fixo que o sistema lança
     * sozinho todo mês, no mesmo dia.
     */
    @Transactional
    public Transacao lancar(TransacaoForm form, Usuario usuario) {
        Transacao transacao = new Transacao();
        preencher(transacao, form, usuario);
        transacao.persist();
        if (Boolean.TRUE.equals(form.repetir())) {
            fixas.criarAPartirDe(transacao);
        }
        return transacao;
    }

    @Transactional
    public Transacao atualizar(Long id, TransacaoForm form, Usuario usuario) {
        Transacao transacao = buscar(id, usuario);
        if (transacao.ehTransferencia()) {
            throw new RegraException("Uma transferência não pode ser editada: exclua e faça de novo");
        }
        preencher(transacao, form, usuario);
        return transacao;
    }

    /** Exclui a transação. Se for uma transferência, exclui as duas pontas juntas. */
    @Transactional
    public void excluir(Long id, Usuario usuario) {
        Transacao transacao = buscar(id, usuario);
        if (transacao.ehTransferencia()) {
            Transacao.delete("transferencia", transacao.transferencia);
        } else {
            transacao.delete();
        }
    }

    /**
     * Transferência entre duas contas do usuário: uma saída (S) na origem e uma entrada (E) no destino,
     * ligadas pelo mesmo código. Como o método é @Transactional, ou grava as duas ou nenhuma.
     */
    @Transactional
    public List<Transacao> transferir(TransferenciaForm form, Usuario usuario) {
        if (form == null || form.origemId() == null || form.destinoId() == null) {
            throw new RegraException("Escolha a conta de origem e a de destino");
        }
        if (form.origemId().equals(form.destinoId())) {
            throw new RegraException("A conta de origem e a de destino precisam ser diferentes");
        }
        Conta origem = contas.buscar(form.origemId(), usuario);
        Conta destino = contas.buscar(form.destinoId(), usuario);
        BigDecimal valor = Validar.valorPositivo(form.valor());
        LocalDate data = Validar.data(form.datatransacao());
        String descricao = form.descricao() == null || form.descricao().isBlank()
                ? "De " + origem.descricao + " para " + destino.descricao
                : Validar.texto(form.descricao(), "a descrição", 500);
        String codigo = UUID.randomUUID().toString();

        Transacao saida = novaPonta(origem, Transacao.SAIDA, valor, data, descricao, codigo);
        Transacao entrada = novaPonta(destino, Transacao.ENTRADA, valor, data, descricao, codigo);
        return List.of(saida, entrada);
    }

    /**
     * Tela inicial: saldo de cada conta e geral (sempre de hoje), e do mês escolhido: entradas, saídas e
     * para onde foi o dinheiro (saídas por categoria). Também as últimas transações.
     */
    public ResumoDto resumo(Usuario usuario, String mesTexto) {
        fixas.gerarPendentes(usuario);
        YearMonth mes = Validar.mes(mesTexto);
        if (mes == null) {
            mes = YearMonth.now();
        }
        List<ContaDto> lista = Conta.doUsuario(usuario).stream().map(ContaDto::de).toList();
        BigDecimal saldoGeral = lista.stream().map(ContaDto::saldo).reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate inicio = mes.atDay(1);
        LocalDate fim = mes.atEndOfMonth();
        BigDecimal entradas = somarMes(usuario, Transacao.ENTRADA, inicio, fim);
        BigDecimal saidas = somarMes(usuario, Transacao.SAIDA, inicio, fim);
        List<GastoCategoriaDto> gastos = gastosPorCategoria(usuario, inicio, fim);

        List<TransacaoDto> ultimas = Transacao
                .find("conta.usuario = ?1 order by datatransacao desc, id desc", usuario)
                .page(0, 5).<Transacao>list().stream().map(TransacaoDto::de).toList();

        return new ResumoDto(mes.toString(), lista, saldoGeral, entradas, saidas, gastos, ultimas);
    }

    /**
     * Para onde foi o dinheiro no período: total das saídas de cada categoria, do maior para o menor.
     * Transferências ficam de fora (o dinheiro só mudou de conta).
     */
    private static List<GastoCategoriaDto> gastosPorCategoria(Usuario usuario, LocalDate inicio, LocalDate fim) {
        List<Object[]> linhas = Transacao.getEntityManager().createQuery("""
                        select c.id, c.descricao, c.icone, sum(t.valor), c.limiteMensal
                        from Transacao t join t.categoria c
                        where t.conta.usuario = :usuario and t.tipo = :saida
                          and t.datatransacao between :inicio and :fim
                        group by c.id, c.descricao, c.icone, c.limiteMensal
                        order by sum(t.valor) desc""", Object[].class)
                .setParameter("usuario", usuario)
                .setParameter("saida", Transacao.SAIDA)
                .setParameter("inicio", inicio)
                .setParameter("fim", fim)
                .getResultList();
        return linhas.stream()
                .map(l -> new GastoCategoriaDto((Long) l[0], (String) l[1],
                        l[2] == null ? Categoria.ICONE_PADRAO : (String) l[2], (BigDecimal) l[3], (BigDecimal) l[4]))
                .toList();
    }

    // ---------- auxiliares ----------

    private void preencher(Transacao transacao, TransacaoForm form, Usuario usuario) {
        if (form == null) {
            throw new RegraException("Preencha os dados da transação");
        }
        if (form.contaId() == null) {
            throw new RegraException("Escolha a conta");
        }
        if (form.categoriaId() == null) {
            throw new RegraException("Escolha a categoria");
        }
        Conta conta = contas.buscar(form.contaId(), usuario);
        Categoria categoria = categorias.buscar(form.categoriaId(), usuario);

        // Descrição opcional: sem ela, a transação leva o nome da categoria ("Alimentação")
        transacao.descricao = form.descricao() == null || form.descricao().isBlank()
                ? categoria.descricao
                : Validar.texto(form.descricao(), "a descrição", 500);
        transacao.valor = Validar.valorPositivo(form.valor());
        transacao.tipo = validarTipo(form.tipo());
        transacao.datatransacao = Validar.data(form.datatransacao());
        transacao.conta = conta;
        transacao.categoria = categoria;
    }

    private static Transacao novaPonta(Conta conta, String tipo, BigDecimal valor, LocalDate data,
                                       String descricao, String codigo) {
        Transacao t = new Transacao();
        t.conta = conta;
        t.tipo = tipo;
        t.valor = valor;
        t.datatransacao = data;
        t.descricao = descricao;
        t.transferencia = codigo;
        t.persist();
        return t;
    }

    /** Entradas ou saídas do mês, sem contar as transferências (dinheiro que só mudou de conta). */
    private static BigDecimal somarMes(Usuario usuario, String tipo, LocalDate inicio, LocalDate fim) {
        BigDecimal soma = Transacao.getEntityManager().createQuery("""
                        select sum(t.valor) from Transacao t
                        where t.conta.usuario = :usuario and t.tipo = :tipo
                          and t.transferencia is null and t.datatransacao between :inicio and :fim""", BigDecimal.class)
                .setParameter("usuario", usuario)
                .setParameter("tipo", tipo)
                .setParameter("inicio", inicio)
                .setParameter("fim", fim)
                .getSingleResult();
        return soma == null ? BigDecimal.ZERO : soma;
    }

    private static String validarTipo(String tipo) {
        String t = tipo == null ? "" : tipo.trim().toUpperCase();
        if (!t.equals(Transacao.ENTRADA) && !t.equals(Transacao.SAIDA)) {
            throw new RegraException("Tipo inválido: use E (entrada) ou S (saída)");
        }
        return t;
    }
}
