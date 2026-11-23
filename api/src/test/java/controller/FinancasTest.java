package controller;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.ValidatableResponse;
import io.restassured.specification.RequestSpecification;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

/** Testa a API de ponta a ponta, como o site usa (cookie de sessão + cabeçalho X-Requested-With). */
@QuarkusTest
class FinancasTest {

    // ---------- auxiliares ----------

    /** Cadastra um usuário novo e devolve o cookie da sessão. */
    private static String novoUsuario() {
        String email = "teste-" + UUID.randomUUID() + "@email.com";
        return given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("nome", "Fulano", "email", email, "senha", "senha1234"))
                .post("/auth/cadastro")
                .then().statusCode(201)
                .extract().cookie("financas_sessao");
    }

    private static RequestSpecification como(String sessao) {
        return given().contentType(ContentType.JSON)
                .header("X-Requested-With", "teste")
                .cookie("financas_sessao", sessao);
    }

    private static int criarConta(String sessao, String descricao, String saldoInicial) {
        return como(sessao).body(Map.of("descricao", descricao, "saldoInicial", saldoInicial))
                .post("/contas").then().statusCode(201).extract().path("id");
    }

    private static int categoria(String sessao, String descricao) {
        return como(sessao).get("/categorias").then().statusCode(200)
                .extract().path("find { it.descricao == '" + descricao + "' }.id");
    }

    private static ValidatableResponse lancar(String sessao, int conta, int categoria, String tipo, String valor) {
        return como(sessao).body(Map.of("descricao", "Teste", "valor", valor, "tipo", tipo,
                        "datatransacao", "2026-11-10", "contaId", conta, "categoriaId", categoria))
                .post("/transacoes").then();
    }

    // ---------- autenticação ----------

    @Test
    void semLoginRecusa() {
        given().get("/contas").then().statusCode(401);
        given().get("/resumo").then().statusCode(401);
    }

    @Test
    void cookieDeSessaoEhHttpOnly() {
        String email = "cookie-" + UUID.randomUUID() + "@email.com";
        String setCookie = given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("nome", "Fulano", "email", email, "senha", "senha1234"))
                .post("/auth/cadastro")
                .then().statusCode(201)
                .body("token", nullValue()) // o token não vai no corpo
                .extract().header("Set-Cookie");
        org.hamcrest.MatcherAssert.assertThat(setCookie, containsString("HttpOnly"));
        org.hamcrest.MatcherAssert.assertThat(setCookie, containsString("SameSite=Strict"));
    }

    @Test
    void loginComSenhaErradaRecusa() {
        String email = "login-" + UUID.randomUUID() + "@email.com";
        given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("nome", "Fulano", "email", email, "senha", "senha1234"))
                .post("/auth/cadastro").then().statusCode(201);

        given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("email", email, "senha", "errada123"))
                .post("/auth/login").then().statusCode(401);

        given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("email", email.toUpperCase(), "senha", "senha1234"))
                .post("/auth/login").then().statusCode(200).body("email", equalTo(email));
    }

    @Test
    void senhaFracaRecusada() {
        given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("nome", "Fulano", "email", "fraca@email.com", "senha", "12345678"))
                .post("/auth/cadastro").then().statusCode(422);
    }

    @Test
    void semCabecalhoCsrfRecusa() {
        String sessao = novoUsuario();
        given().contentType(ContentType.JSON).cookie("financas_sessao", sessao)
                .body(Map.of("descricao", "Nubank", "saldoInicial", "0"))
                .post("/contas").then().statusCode(403);
    }

    // ---------- contas, categorias, transações ----------

    @Test
    void saldoDaContaSomaEntradasESubtraiSaidas() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "1000.00");
        int salario = categoria(sessao, "Salário");
        int mercado = categoria(sessao, "Alimentação");

        lancar(sessao, nubank, salario, "E", "3000.00").statusCode(201);
        lancar(sessao, nubank, mercado, "S", "250.50").statusCode(201);

        como(sessao).get("/contas/" + nubank).then().statusCode(200)
                .body("saldo", equalTo(3749.50f));
    }

    @Test
    void filtraTransacoesPorContaECategoria() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int carteira = criarConta(sessao, "Carteira", "0");
        int alimentacao = categoria(sessao, "Alimentação");
        int transporte = categoria(sessao, "Transporte");

        lancar(sessao, nubank, alimentacao, "S", "10").statusCode(201);
        lancar(sessao, nubank, transporte, "S", "20").statusCode(201);
        lancar(sessao, carteira, alimentacao, "S", "30").statusCode(201);

        como(sessao).queryParam("contaId", nubank).get("/transacoes").then()
                .body("", hasSize(2)).body("contaId", everyItem(is(nubank)));
        como(sessao).queryParam("categoriaId", alimentacao).get("/transacoes").then()
                .body("", hasSize(2)).body("categoriaId", everyItem(is(alimentacao)));
        como(sessao).queryParam("contaId", nubank).queryParam("categoriaId", alimentacao).get("/transacoes").then()
                .body("", hasSize(1)).body("[0].valor", equalTo(10.0f));
    }

    @Test
    void transferenciaGeraSaidaEEntrada() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "500");
        int carteira = criarConta(sessao, "Carteira", "0");

        como(sessao).body(Map.of("origemId", nubank, "destinoId", carteira, "valor", "100",
                        "datatransacao", "2026-11-10"))
                .post("/transacoes/transferencia").then().statusCode(201)
                .body("", hasSize(2))
                .body("[0].tipo", equalTo("S")).body("[1].tipo", equalTo("E"));

        como(sessao).get("/resumo").then().statusCode(200)
                .body("contas.find { it.descricao == 'Nubank' }.saldo", equalTo(400.0f))
                .body("contas.find { it.descricao == 'Carteira' }.saldo", equalTo(100.0f))
                .body("saldoGeral", equalTo(500.0f));

        // Excluir uma ponta exclui as duas
        int idSaida = como(sessao).queryParam("contaId", nubank).get("/transacoes").then()
                .extract().path("[0].id");
        como(sessao).delete("/transacoes/" + idSaida).then().statusCode(204);
        como(sessao).get("/transacoes").then().body("", hasSize(0));
    }

    @Test
    void transferenciaParaAMesmaContaRecusada() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "500");
        como(sessao).body(Map.of("origemId", nubank, "destinoId", nubank, "valor", "10"))
                .post("/transacoes/transferencia").then().statusCode(422);
    }

    @Test
    void valorInvalidoRecusado() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int outros = categoria(sessao, "Outros");
        lancar(sessao, nubank, outros, "S", "0").statusCode(422);
        lancar(sessao, nubank, outros, "S", "-5").statusCode(422);
        lancar(sessao, nubank, outros, "S", "1.999").statusCode(422);
        lancar(sessao, nubank, outros, "X", "10").statusCode(422);
    }

    @Test
    void editaEExcluiLancamento() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int outros = categoria(sessao, "Outros");
        int id = lancar(sessao, nubank, outros, "S", "10").statusCode(201).extract().path("id");

        como(sessao).body(Map.of("descricao", "Corrigido", "valor", "15", "tipo", "S",
                        "datatransacao", "2026-11-11", "contaId", nubank, "categoriaId", outros))
                .put("/transacoes/" + id).then().statusCode(200)
                .body("descricao", equalTo("Corrigido")).body("valor", equalTo(15.0f));

        como(sessao).delete("/transacoes/" + id).then().statusCode(204);
        como(sessao).get("/transacoes/" + id).then().statusCode(404);
    }

    @Test
    void naoExcluiContaNemCategoriaEmUso() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int outros = categoria(sessao, "Outros");
        lancar(sessao, nubank, outros, "S", "10").statusCode(201);

        como(sessao).delete("/contas/" + nubank).then().statusCode(422);
        como(sessao).delete("/categorias/" + outros).then().statusCode(422);
    }

    @Test
    void categoriaComNomeRepetidoRecusada() {
        String sessao = novoUsuario();
        como(sessao).body(Map.of("descricao", "Pets", "icone", "pets")).post("/categorias").then().statusCode(201)
                .body("id", notNullValue()).body("icone", equalTo("pets"));
        como(sessao).body(Map.of("descricao", "pets")).post("/categorias").then().statusCode(422);
    }

    @Test
    void resumoDoMesComGastosPorCategoria() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "1000");
        int carteira = criarConta(sessao, "Carteira", "0");
        int alimentacao = categoria(sessao, "Alimentação");
        int transporte = categoria(sessao, "Transporte");
        int salario = categoria(sessao, "Salário");

        lancar(sessao, nubank, alimentacao, "S", "100").statusCode(201);     // 10/11
        lancar(sessao, nubank, alimentacao, "S", "50").statusCode(201);      // 10/11
        lancar(sessao, carteira, transporte, "S", "30").statusCode(201);     // 10/11
        lancar(sessao, nubank, salario, "E", "2000").statusCode(201);        // 10/11
        // Outro mês: não entra no resumo de novembro
        como(sessao).body(Map.of("descricao", "Outubro", "valor", "999", "tipo", "S",
                        "datatransacao", "2026-10-15", "contaId", nubank, "categoriaId", transporte))
                .post("/transacoes").then().statusCode(201);
        // Transferência: não é gasto
        como(sessao).body(Map.of("origemId", nubank, "destinoId", carteira, "valor", "40",
                        "datatransacao", "2026-11-10"))
                .post("/transacoes/transferencia").then().statusCode(201);

        como(sessao).queryParam("mes", "2026-11").get("/resumo").then().statusCode(200)
                .body("mes", equalTo("2026-11"))
                .body("entradasMes", equalTo(2000.0f))
                .body("saidasMes", equalTo(180.0f))
                .body("gastosPorCategoria", hasSize(2))
                .body("gastosPorCategoria[0].categoria", equalTo("Alimentação"))
                .body("gastosPorCategoria[0].total", equalTo(150.0f))
                .body("gastosPorCategoria[0].icone", equalTo("restaurant"))
                .body("gastosPorCategoria[1].total", equalTo(30.0f));

        como(sessao).queryParam("mes", "2026-10").get("/resumo").then()
                .body("saidasMes", equalTo(999.0f))
                .body("gastosPorCategoria[0].categoria", equalTo("Transporte"));

        como(sessao).queryParam("mes", "novembro").get("/resumo").then().statusCode(422);
    }

    @Test
    void filtraPorMesEPorTexto() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int transporte = categoria(sessao, "Transporte");
        como(sessao).body(Map.of("descricao", "Uber para o trabalho", "valor", "20", "tipo", "S",
                "datatransacao", "2026-11-03", "contaId", nubank, "categoriaId", transporte)).post("/transacoes");
        como(sessao).body(Map.of("descricao", "Ônibus", "valor", "5", "tipo", "S",
                "datatransacao", "2026-11-04", "contaId", nubank, "categoriaId", transporte)).post("/transacoes");
        como(sessao).body(Map.of("descricao", "UBER de outubro", "valor", "30", "tipo", "S",
                "datatransacao", "2026-10-20", "contaId", nubank, "categoriaId", transporte)).post("/transacoes");
        como(sessao).body(Map.of("descricao", "100% off_", "valor", "1", "tipo", "S",
                "datatransacao", "2026-10-21", "contaId", nubank, "categoriaId", transporte)).post("/transacoes");

        como(sessao).queryParam("mes", "2026-11").get("/transacoes").then().body("", hasSize(2));
        // Busca sem diferenciar maiúsculas
        como(sessao).queryParam("busca", "uber").get("/transacoes").then().body("", hasSize(2));
        como(sessao).queryParam("busca", "uber").queryParam("mes", "2026-11").get("/transacoes").then()
                .body("", hasSize(1)).body("[0].descricao", equalTo("Uber para o trabalho"));
        // % e _ digitados são texto, não curinga
        como(sessao).queryParam("busca", "%").get("/transacoes").then().body("", hasSize(1));
        como(sessao).queryParam("mes", "13-2026").get("/transacoes").then().statusCode(422);
    }

    @Test
    void limiteDaCategoriaApareceNosGastos() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int lazer = categoria(sessao, "Lazer");
        como(sessao).body(Map.of("descricao", "Lazer", "icone", "celebration", "limiteMensal", "300"))
                .put("/categorias/" + lazer).then().statusCode(200).body("limiteMensal", equalTo(300.0f));
        lancar(sessao, nubank, lazer, "S", "250").statusCode(201);

        como(sessao).queryParam("mes", "2026-11").get("/resumo").then()
                .body("gastosPorCategoria[0].limiteMensal", equalTo(300.0f))
                .body("gastosPorCategoria[0].total", equalTo(250.0f));
        // Limite zero = sem limite; negativo = erro
        como(sessao).body(Map.of("descricao", "Lazer", "limiteMensal", "0")).put("/categorias/" + lazer).then()
                .statusCode(200).body("limiteMensal", nullValue());
        como(sessao).body(Map.of("descricao", "Lazer", "limiteMensal", "-5")).put("/categorias/" + lazer).then()
                .statusCode(422);
    }

    @Test
    void baixaPlanilhaCsv() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int alimentacao = categoria(sessao, "Alimentação");
        como(sessao).body(Map.of("descricao", "=1+1 mercado", "valor", "25.90", "tipo", "S",
                "datatransacao", "2026-11-10", "contaId", nubank, "categoriaId", alimentacao)).post("/transacoes");

        String csv = como(sessao).queryParam("mes", "2026-11").get("/transacoes/planilha").then()
                .statusCode(200)
                .contentType(containsString("text/csv"))
                .header("Content-Disposition", containsString("movimentacoes-2026-11.csv"))
                .extract().asString();
        org.hamcrest.MatcherAssert.assertThat(csv, containsString("Data;Descrição;Categoria;Conta;Tipo;Valor"));
        org.hamcrest.MatcherAssert.assertThat(csv, containsString("10/11/2026;\"'=1+1 mercado\";\"Alimentação\";\"Nubank\";Saiu;-25,90"));
    }

    @Test
    void fixoSeRepeteTodoMes() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int moradia = categoria(sessao, "Moradia");
        // Aluguel fixo que começou há 2 meses: o sistema lança os meses que faltam sozinho
        String inicio = java.time.LocalDate.now().minusMonths(2).withDayOfMonth(1).toString();
        como(sessao).body(Map.of("descricao", "Aluguel", "valor", "1000", "tipo", "S", "datatransacao", inicio,
                        "contaId", nubank, "categoriaId", moradia, "repetir", true))
                .post("/transacoes").then().statusCode(201).body("fixa", is(true));

        como(sessao).queryParam("busca", "aluguel").get("/transacoes").then()
                .body("", hasSize(3)).body("fixa", everyItem(is(true)));
        int fixa = como(sessao).get("/fixas").then().statusCode(200).body("", hasSize(1))
                .body("[0].dia", equalTo(1)).extract().path("[0].id");
        // Abrir de novo não lança em dobro
        como(sessao).get("/resumo").then().statusCode(200);
        como(sessao).queryParam("busca", "aluguel").get("/transacoes").then().body("", hasSize(3));
        // Conta com fixo não pode ser excluída
        como(sessao).delete("/contas/" + nubank).then().statusCode(422);

        // Parar de repetir: o que já foi lançado continua
        como(sessao).delete("/fixas/" + fixa).then().statusCode(204);
        como(sessao).get("/fixas").then().body("", hasSize(0));
        como(sessao).queryParam("busca", "aluguel").get("/transacoes").then()
                .body("", hasSize(3)).body("fixa", everyItem(is(false)));
    }

    @Test
    void entraDepoisComAMesmaSenha() {
        String email = "volta-" + UUID.randomUUID() + "@email.com";
        given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("nome", "Fulano", "email", email, "senha", "senha1234"))
                .post("/auth/cadastro").then().statusCode(201);
        // Outra sessão, só com e-mail e senha: entra e enxerga os próprios dados
        String sessao = given().contentType(ContentType.JSON).header("X-Requested-With", "teste")
                .body(Map.of("email", email, "senha", "senha1234"))
                .post("/auth/login").then().statusCode(200).extract().cookie("financas_sessao");
        como(sessao).get("/auth/eu").then().statusCode(200).body("email", equalTo(email));
        como(sessao).get("/categorias").then().body("", hasSize(7));
    }

    @Test
    void semDescricaoUsaONomeDaCategoria() {
        String sessao = novoUsuario();
        int nubank = criarConta(sessao, "Nubank", "0");
        int alimentacao = categoria(sessao, "Alimentação");
        como(sessao).body(Map.of("descricao", " ", "valor", "25.90", "tipo", "S",
                        "contaId", nubank, "categoriaId", alimentacao))
                .post("/transacoes").then().statusCode(201)
                .body("descricao", equalTo("Alimentação"));
    }

    @Test
    void categoriaComIcone() {
        String sessao = novoUsuario();
        // As padrão já vêm com ícone
        como(sessao).get("/categorias").then()
                .body("find { it.descricao == 'Alimentação' }.icone", equalTo("restaurant"));
        // Sem ícone: usa a etiqueta
        como(sessao).body(Map.of("descricao", "Diversos")).post("/categorias").then().statusCode(201)
                .body("icone", equalTo("sell"));
        // Ícone com caracteres inválidos é recusado
        como(sessao).body(Map.of("descricao", "Hack", "icone", "<script>")).post("/categorias").then()
                .statusCode(422);
    }

    // ---------- isolamento entre usuários ----------

    @Test
    void naoVeNemMexeNosDadosDeOutroUsuario() {
        String ana = novoUsuario();
        String beto = novoUsuario();
        int contaDaAna = criarConta(ana, "Nubank da Ana", "100");
        int categoriaDoBeto = categoria(beto, "Outros");
        int contaDoBeto = criarConta(beto, "Conta do Beto", "0");

        como(beto).get("/contas/" + contaDaAna).then().statusCode(404);
        como(beto).delete("/contas/" + contaDaAna).then().statusCode(404);
        como(beto).get("/contas").then().body("", hasSize(1));
        // Lançar na conta de outra pessoa
        lancar(beto, contaDaAna, categoriaDoBeto, "S", "10").statusCode(404);
        // Transferir da conta de outra pessoa para a minha
        como(beto).body(Map.of("origemId", contaDaAna, "destinoId", contaDoBeto, "valor", "50"))
                .post("/transacoes/transferencia").then().statusCode(404);
        como(ana).get("/contas/" + contaDaAna).then().body("saldo", equalTo(100.0f));
    }
}
