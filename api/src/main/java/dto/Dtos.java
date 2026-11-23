package dto;

import entity.Categoria;
import entity.Conta;
import entity.Transacao;
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

    /** icone: nome de um ícone do Material Symbols (ex.: "pets"); vazio usa a etiqueta padrão. */
    public record CategoriaForm(String descricao, String icone) {
    }

    public record CategoriaDto(Long id, String descricao, String icone) {
        public static CategoriaDto de(Categoria c) {
            return new CategoriaDto(c.id, c.descricao, c.iconeOuPadrao());
        }
    }

    // ---------- Transações ----------

    /** tipo: "E" (entrada) ou "S" (saída). */
    public record TransacaoForm(String descricao, BigDecimal valor, String tipo, LocalDate datatransacao,
                                Long contaId, Long categoriaId) {
    }

    public record TransferenciaForm(Long origemId, Long destinoId, BigDecimal valor, LocalDate datatransacao,
                                    String descricao) {
    }

    public record TransacaoDto(Long id, String descricao, BigDecimal valor, String tipo, LocalDate datatransacao,
                               Long contaId, String conta, Long categoriaId, String categoria,
                               String categoriaIcone, boolean transferencia) {
        public static TransacaoDto de(Transacao t) {
            return new TransacaoDto(t.id, t.descricao, t.valor, t.tipo, t.datatransacao,
                    t.conta.id, t.conta.descricao,
                    t.categoria == null ? null : t.categoria.id,
                    t.categoria == null ? null : t.categoria.descricao,
                    t.categoria == null ? null : t.categoria.iconeOuPadrao(),
                    t.ehTransferencia());
        }
    }

    // ---------- Tela inicial ----------

    public record ResumoDto(List<ContaDto> contas, BigDecimal saldoGeral,
                            BigDecimal entradasMes, BigDecimal saidasMes,
                            List<TransacaoDto> ultimas) {
    }

    // ---------- Erros ----------

    public record Erro(String erro) {
    }
}
