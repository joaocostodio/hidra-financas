package dto;

import entity.Categoria;
import entity.Conta;
import entity.Transacao;
import entity.TransacaoFixa;
import entity.Usuario;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * O que entra e sai da API (records). As entidades não saem direto para não expor o usuário dono
 * (e a senha) nem calcular o saldo de uma conta em cada transação.
 */
public final class Dtos {

    private Dtos() {
    }

    // ---------- Sessão ----------

    public record CadastroForm(String nome, String email, String senha) {
    }

    public record LoginForm(String email, String senha) {
    }

    public record UsuarioDto(Long id, String nome, String email) {
        public static UsuarioDto de(Usuario u) {
            return new UsuarioDto(u.id, u.nome, u.email);
        }
    }

    // ---------- Contas ----------

    public record ContaForm(String descricao, BigDecimal saldoInicial) {
    }

    public record ContaDto(Long id, String descricao, BigDecimal saldoInicial, BigDecimal saldo) {
        public static ContaDto de(Conta c) {
            return new ContaDto(c.id, c.descricao, c.saldoInicial, c.saldo());
        }
    }

    // ---------- Categorias ----------

    /**
     * icone: nome de um ícone do Material Symbols (ex.: "pets"); vazio usa a etiqueta padrão.
     * limiteMensal: quanto quer gastar no máximo por mês (opcional; vazio ou 0 = sem limite).
     */
    public record CategoriaForm(String descricao, String icone, BigDecimal limiteMensal) {
    }

    public record CategoriaDto(Long id, String descricao, String icone, BigDecimal limiteMensal) {
        public static CategoriaDto de(Categoria c) {
            return new CategoriaDto(c.id, c.descricao, c.iconeOuPadrao(), c.limiteMensal);
        }
    }

    // ---------- Transações ----------

    /** tipo: "E" (entrada) ou "S" (saída). repetir: true = vira um fixo que se repete todo mês. */
    public record TransacaoForm(String descricao, BigDecimal valor, String tipo, LocalDate datatransacao,
                                Long contaId, Long categoriaId, Boolean repetir) {
    }

    public record TransferenciaForm(Long origemId, Long destinoId, BigDecimal valor, LocalDate datatransacao,
                                    String descricao) {
    }

    public record TransacaoDto(Long id, String descricao, BigDecimal valor, String tipo, LocalDate datatransacao,
                               Long contaId, String conta, Long categoriaId, String categoria,
                               String categoriaIcone, boolean transferencia, boolean fixa) {
        public static TransacaoDto de(Transacao t) {
            return new TransacaoDto(t.id, t.descricao, t.valor, t.tipo, t.datatransacao,
                    t.conta.id, t.conta.descricao,
                    t.categoria == null ? null : t.categoria.id,
                    t.categoria == null ? null : t.categoria.descricao,
                    t.categoria == null ? null : t.categoria.iconeOuPadrao(),
                    t.ehTransferencia(), t.fixa != null);
        }
    }

    // ---------- Fixos (repetem todo mês) ----------

    public record FixaDto(Long id, String descricao, BigDecimal valor, String tipo, int dia, LocalDate proxima,
                          Long contaId, String conta, Long categoriaId, String categoria, String categoriaIcone) {
        public static FixaDto de(TransacaoFixa f) {
            return new FixaDto(f.id, f.descricao, f.valor, f.tipo, f.dia, f.proxima,
                    f.conta.id, f.conta.descricao, f.categoria.id, f.categoria.descricao,
                    f.categoria.iconeOuPadrao());
        }
    }

    // ---------- Tela inicial ----------

    /** mes: "2026-11". As somas e os gastos são desse mês; os saldos são sempre os de hoje. */
    public record ResumoDto(String mes, List<ContaDto> contas, BigDecimal saldoGeral,
                            BigDecimal entradasMes, BigDecimal saidasMes,
                            List<GastoCategoriaDto> gastosPorCategoria,
                            List<TransacaoDto> ultimas) {
    }

    /** Quanto saiu numa categoria no mês ("para onde foi o dinheiro"), e o limite dela, se tiver. */
    public record GastoCategoriaDto(Long categoriaId, String categoria, String icone, BigDecimal total,
                                    BigDecimal limiteMensal) {
    }

    // ---------- Erros ----------

    public record Erro(String erro) {
    }
}
