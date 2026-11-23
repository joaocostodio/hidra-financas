# Guia de avaliação

Para conferir cada item pedido em poucos minutos. Para cada requisito há três colunas:
**onde ver na tela**, **onde está no código** e **qual teste automático prova**.

Os testes ficam todos em [`api/src/test/java/controller/FinancasTest.java`](../api/src/test/java/controller/FinancasTest.java)
e rodam com `cd api` → `mvnw.cmd test` (Windows) ou `./mvnw test` (Linux/Mac). Resultado esperado:
`Tests run: 23` (FinancasTest), `Tests run: 4` (BancoDaNuvemTest) e `Tests run: 4` (ChavesDaNuvemTest), todos com
`Failures: 0, Errors: 0`.

> **Versão no ar:** <https://hidra-financas.onrender.com> (Render + Neon, grátis). Se ninguém acessou nos últimos
> 15 minutos, o primeiro acesso demora cerca de 1 minuto enquanto o servidor acorda.

> **Sem instalar nada:** se o aluno mandou um link `https://….trycloudflare.com`, o sistema está rodando no
> notebook dele e dá para usar direto pelo navegador (crie uma conta na aba **Criar conta**). Como funciona:
> README, seção "Acessar de outro computador".

## 1. Preparar (uma vez)

Requisitos: Docker Desktop ligado, JDK 21 e Node.js 22+.

```bash
docker compose up -d                 # PostgreSQL em localhost:5434
cd api && ./mvnw quarkus:dev         # API em http://localhost:8090  (Windows: mvnw.cmd quarkus:dev)
cd web && npm install && npm start   # Site em http://localhost:4200 (outro terminal)
```

Abra http://localhost:4200 → aba **Criar conta** (qualquer e-mail; senha com 8+ caracteres, letras e números).

## 2. Requisitos pedidos

| # | Requisito | Onde ver na tela | Onde está no código | Teste |
|---|---|---|---|---|
| 1 | **Quarkus + Angular** | — | `api/pom.xml` (Quarkus 3, Panache, PostgreSQL), `web/package.json` (Angular 22 + Material) | todos |
| 2 | **Lançamento de contas** | Menu **Contas** → "Nova conta" (nome + saldo inicial); clicar numa conta edita/exclui | `ContaController` → `ContaService` → `Conta` | `saldoDaContaSomaEntradasESubtraiSaidas`, `naoExcluiContaNemCategoriaEmUso` |
| 3 | **Categorias** | Menu **Categorias** (7 já vêm prontas) → "Nova categoria" | `CategoriaController` → `CategoriaService` → `Categoria` | `categoriaComNomeRepetidoRecusada`, `categoriaComIcone`, `naoExcluiContaNemCategoriaEmUso` |
| 4 | **Transações** (receitas e despesas) | Botão verde **+ Anotar** (canto de todas as telas): "Saiu"/"Entrou", valor, categoria, conta, dia. Clicar numa linha corrige ou exclui | `TransacaoController` → `TransacaoService.lancar/atualizar/excluir` → `Transacao` | `editaEExcluiLancamento`, `valorInvalidoRecusado`, `semDescricaoUsaONomeDaCategoria` |
| 5 | **Transações filtradas por categoria e conta** | Menu **Movimentações**: selects "Conta" e "Categoria" (e tipo). O filtro vai para a URL | `TransacaoService.listar` (monta o `where` só com os filtros preenchidos) | `filtraTransacoesPorContaECategoria` |
| 6 | **Transferência entre contas** | **Passar entre contas** (Início, Contas ou Movimentações) | `TransacaoService.transferir`: uma saída + uma entrada, mesmo código, `@Transactional` | `transferenciaGeraSaidaEEntrada`, `transferenciaParaAMesmaContaRecusada` |
| 7 | **Tela inicial com saldo por conta e geral** | **Início**: cartão "Você tem hoje" (geral) e um cartão por conta | `TransacaoService.resumo` + `Conta.saldo()` | `saldoDaContaSomaEntradasESubtraiSaidas`, `resumoDoMesComGastosPorCategoria` |
| 8 | **Autenticação JWT em cookie httpOnly** | DevTools (F12) → Application → Cookies → `financas_sessao` com **HttpOnly** ✓ e **SameSite Strict** (e **Secure** quando aberto pelo link `https://`) | `AuthService.gerarToken`, `CookieSessao`, `application.properties` (`mp.jwt.token.cookie`) | `cookieDeSessaoEhHttpOnly`, `cookieViaHttpsEhSecure`, `semLoginRecusa`, `loginComSenhaErradaRecusa`, `entraDepoisComAMesmaSenha` |

## 3. Além do pedido

| Funcionalidade | Onde ver na tela | Onde está no código | Teste |
|---|---|---|---|
| Fixos mensais (aluguel, salário) | Ao anotar, chave **Repetir todo mês**; botão **Fixos** em Movimentações | `TransacaoFixa.gerarAte`, `FixaService`, `FixaController` | `fixoSeRepeteTodoMes` |
| Limite por categoria | Categorias → "Limite por mês"; aviso no gráfico do Início | `Categoria.limiteMensal`, `gastos-categoria.ts` | `limiteDaCategoriaApareceNosGastos` |
| Resumo do mês + gráfico | Início → "Resumo do mês" ‹ › e "Para onde foi o dinheiro" | `TransacaoService.gastosPorCategoria` (JPQL `group by`/`sum`) | `resumoDoMesComGastosPorCategoria` |
| Filtro por mês e busca por texto | Movimentações → ‹ mês ›, "Procurar" | `TransacaoService.listar` (`like` com parâmetro) | `filtraPorMesEPorTexto` |
| Planilha para o Excel | Movimentações → **Baixar planilha** | `Planilha.csv` | `baixaPlanilhaCsv` |
| Senha forte e com hash | Criar conta (a lista da senha vai marcando) | `AuthService.validarSenha`, `Usuario.definirSenha` (BCrypt) | `senhaFracaRecusada` |
| Proteção CSRF | — (toda mudança sem o cabeçalho recebe 403) | `ProtecaoCsrf`, `auth.interceptor.ts` | `semCabecalhoCsrfRecusa` |
| Cada um só vê o que é seu | Criar um 2º usuário: ele não vê nada do 1º | `UsuarioLogado` + filtro por usuário em todas as consultas | `naoVeNemMexeNosDadosDeOutroUsuario` |
| Tema claro/escuro | Botão lua/sol no canto inferior do menu | `common/tema` | — |

## 4. Roteiro rápido (≈ 10 minutos)

1. **Criar conta** → o passo a passo pergunta onde a pessoa guarda dinheiro: criar "Nubank" (1.000) e "Carteira" (100).
2. **F12 → Application → Cookies**: ver `financas_sessao` com HttpOnly.
3. **+ Anotar** → "Entrou" 3.000, categoria Salário, no Nubank, marcar **Repetir todo mês** → Salvar.
4. **+ Anotar** → "Saiu" 250, Alimentação → Salvar.
5. **Categorias** → Alimentação → Limite por mês 200 → Salvar. Voltar ao **Início**: Alimentação aparece "Passou do limite".
6. **Passar entre contas** → 100 do Nubank para a Carteira. No Início: Nubank 3.650, Carteira 200, total 3.850
   (a transferência não entra como "Entrou"/"Saiu" do mês).
7. **Movimentações** → filtrar por conta "Carteira", depois por categoria; mudar o mês com ‹; **Baixar planilha** e abrir no Excel.
8. **Movimentações → Fixos**: o salário aparece com a próxima data (mês que vem).
9. **Sair** (ícone ao lado do nome) e tentar abrir http://localhost:4200/contas → volta para Entrar.
   Pela API sem cookie: `curl -i http://localhost:8090/contas` → **401**.

## 5. Conferir a API direto (opcional)

```bash
# login (guarda o cookie em cookies.txt)
curl -i -c cookies.txt -H "Content-Type: application/json" -H "X-Requested-With: curl" \
     -d '{"email":"seu@email.com","senha":"suaSenha123"}' http://localhost:8090/auth/login

curl -b cookies.txt http://localhost:8090/resumo                       # saldos e resumo do mês
curl -b cookies.txt "http://localhost:8090/transacoes?contaId=1&tipo=S" # filtro
curl -i -b cookies.txt -X POST -H "Content-Type: application/json" \
     -d '{"descricao":"x","saldoInicial":0}' http://localhost:8090/contas # sem X-Requested-With → 403
```

## 6. Onde ler mais

- [README](../README.md): visão geral, como executar, API completa, conceitos de POO e segurança.
- [Arquitetura](arquitetura.md): camadas, diagramas (requisição, modelo de dados, fixos) e decisões.
- [Especificações das telas](specs/): o que cada tela faz, no formato "Quando... então...".
- [Roteiro da apresentação](apresentacao.md).
- [Hospedagem](hospedagem-render.md): como a versão no ar funciona (Render + Neon).

## 7. Relação com os projetos da aula

### Atividade prática de 28/09 (`atividade-poo-api.pdf`)

| Item | Onde está |
|---|---|
| a) Repositório novo no GitHub | <https://github.com/joaocostodio/hidra-financas> |
| b) Tabelas `categoria`, `conta` e `transacao` no PostgreSQL | Criadas pelo Hibernate a partir das entidades, com os mesmos tipos do `financeiro.sql` da aula: `descricao varchar(500)`, `valor numeric(12,2)`, `tipo varchar(1)`, `datatransacao date`, chaves estrangeiras `conta_id` e `categoria_id` |
| c) Mapeamento das entidades | `entity/Categoria`, `Conta`, `Transacao` herdando de `PanacheEntity`, como no exemplo da aula |
| d) PUT e DELETE em Categoria | `CategoriaController.atualizar` / `excluir` (o DELETE recusa categoria em uso) |
| e) Controller de conta | `ContaController` (listar, buscar, criar, atualizar, excluir) |
| f) Controller de transação | `TransacaoController` (com filtros, transferência e planilha) |
| g) Commit e push | Histórico no GitHub |

### O que mudou em relação ao `finance-api` e ao `finance-ui`

| Na aula | Aqui | Por quê |
|---|---|---|
| A entidade entra e sai direto da API | DTOs (`record`) em `dto/Dtos.java` | Não expõe campos internos nem aceita campos que o cliente não deveria mandar |
| Sem validação | Regras no service (`Validar`, `*Service`) | Valor negativo, conta de outra pessoa, nome repetido... viram erro 422/404 |
| Sem login | JWT em cookie httpOnly | Pedido do trabalho final |
| CORS liberado para `localhost:4200` | Proxy do `ng serve` (mesmo endereço) | Não precisa de CORS; o cookie fica `SameSite=Strict` |
| `categoria_id NOT NULL` | Pode ser nulo | Transferência não tem categoria (no `finance-api` a transferência também não define categoria) |
| `@Path("transacao")` e `/por-conta/{id}` | `/transacoes?contaId=&categoriaId=...` | Plural como `/contas` e `/categorias`; um endpoint só com filtros combináveis |
| Transferência em dois `persist` soltos | `@Transactional` + código comum nas duas partes | Grava as duas ou nenhuma; excluir uma exclui as duas |
| `finance-ui`: só cadastro de contas, com dados falsos se a API falhar | Todas as telas ligadas à API | Mesmas instruções de Angular (`web/.github/instructions`) e mesmo formato de spec (`docs/specs`) |
