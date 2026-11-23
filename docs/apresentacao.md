# Roteiro da apresentação

Ideia em uma frase: **é uma planilha de gastos transformada em sistema**. Cada linha é uma transação; as colunas
Conta e Categoria viram cadastros; o filtro do Excel vira o filtro da tela; as somas viram a tela inicial.

Na tela as palavras são do dia a dia; ao explicar, use os termos do pedido: **Movimentações = transações**,
**Entrou/Saiu = receita/despesa**, **Passar entre contas = transferência**.

## Antes de começar

1. `docker compose up -d` (Docker Desktop ligado)
2. `cd api` → `mvnw.cmd quarkus:dev`
3. `cd web` → `npm start`
4. Abrir http://localhost:4200

## Demonstração (na ordem do que o professor pediu)

| # | Mostrar | Explicar no código |
|---|---|---|
| 1 | Aba **Criar conta** (a lista da senha vai marcando) e o passo a passo "Onde você guarda seu dinheiro?" | `AuthController.cadastrar` → `AuthService.cadastrar` (hash da senha, categorias padrão); `boas-vindas.ts` cria as contas com o saldo inicial |
| 2 | Abrir o DevTools → Application → Cookies: `financas_sessao` com **HttpOnly** | `CookieSessao.criar` (HttpOnly + SameSite=Strict) e `application.properties` (`mp.jwt.token.cookie`) |
| 3 | **Contas**: cadastrar "Nubank" (saldo inicial 1.000) e "Carteira" (100) | `ContaService` + `Conta` (entidade Panache) |
| 4 | **Categorias**: criar "Pets" | `CategoriaService` (nome repetido → erro 422) |
| 5 | **+ Anotar**: "Entrou" 3.000 (Salário) no Nubank; "Saiu" 250 (Alimentação) | `TransacaoService.lancar` e `Validar.valorPositivo`; no site, `transacao-dialog` e `common/dinheiro.ts` (lê "1.500,00") |
| 6 | **Movimentações**: filtrar por conta, depois por categoria | `TransacaoService.listar` (monta o `where` só com os filtros preenchidos) |
| 7 | **Passar entre contas**: 100 do Nubank para a Carteira | `TransacaoService.transferir`: uma `S` + uma `E`, mesmo código, `@Transactional` |
| 8 | **Início**: saldo de cada conta e geral; no resumo do mês, o gráfico "Para onde foi o dinheiro" e ‹ mês anterior › | `Conta.saldo()` = saldo inicial + entradas − saídas; `TransacaoService.gastosPorCategoria` (JPQL com `group by` e `sum`); `gastos-categoria` (gráfico só com HTML/CSS) |
| 9 | Sair e tentar abrir `/contas` | `logadoGuard` no site e `@Authenticated` na API (401 sem cookie) |

### Extras (se der tempo)

| # | Mostrar | Explicar no código |
|---|---|---|
| 10 | **+ Anotar** "Aluguel" 1.200 com **Repetir todo mês** e data de dois meses atrás → abrir Movimentações: os meses que faltavam aparecem sozinhos, com o ícone de "repete" | `TransacaoFixa.gerarAte()` (laço até hoje, `noDia()` para o dia 31) e `FixaService.gerarPendentes()` com trava `PESSIMISTIC_WRITE` |
| 11 | **Movimentações → Fixos** → "Parar" | `FixaService.excluir`: apaga o fixo, as transações já lançadas ficam |
| 12 | **Categorias** → Alimentação com limite 200 → no Início aparece "Passou do limite" | `Categoria.limiteMensal`; a regra de 80%/100% em `gastos-categoria.ts` |
| 13 | **Movimentações** → ‹ mês ›, "Procurar: mercado" → **Baixar planilha** e abrir no Excel | `TransacaoService.listar` (filtro de mês e `like` com parâmetro); `Planilha.csv` (`;`, vírgula, BOM) |

## Perguntas que o professor pode fazer

- **Por que cookie httpOnly e não localStorage?** O JavaScript não consegue ler um cookie httpOnly. Se alguém
  injetar um script no site (XSS), ele não rouba o token. No localStorage, qualquer script lê.
- **E o CSRF?** O cookie é `SameSite=Strict` (outro site não manda ele) e a API exige o cabeçalho
  `X-Requested-With` em toda mudança (`ProtecaoCsrf`).
- **Como a API sabe quem é o usuário?** Pelo token: o `subject` do JWT é o id do usuário (`UsuarioLogado`).
  Nunca vem do corpo da requisição, então ninguém mexe nos dados de outra pessoa (testado em `FinancasTest`).
- **Por que o saldo não é uma coluna?** Porque ele sempre pode ser calculado pelas transações (como a soma de uma
  planilha). Assim nunca fica desatualizado se uma transação for editada ou excluída.
- **Como a transferência funciona?** Igual ao `finance-api` da aula: duas transações, saída na origem e entrada
  no destino. Acrescentamos um código em comum para excluir as duas juntas, e o `@Transactional` garante que
  grava as duas ou nenhuma.
- **Onde tem POO?** Encapsulamento da senha no `Usuario`; herança de `PanacheEntity`; cada objeto com sua
  responsabilidade (`Conta.saldo()`, `Transacao.ehTransferencia()`); exceções próprias herdando de
  `RuntimeException`.
- **Como o "repetir todo mês" funciona sem uma tarefa agendada?** Sempre que o Início ou as Movimentações abrem,
  a API lança o que já venceu antes de responder. Se a pessoa ficou 3 meses sem abrir, lança os 3 meses.
- **E se duas telas pedirem ao mesmo tempo?** O fixo é lido com `select ... for update` (`PESSIMISTIC_WRITE`):
  a segunda espera a primeira terminar, relê a próxima data (já avançada) e não lança de novo.
- **Por que o CSV usa ponto e vírgula?** No Excel em português a vírgula é o separador de centavos; com `;` e o
  BOM do UTF-8 o arquivo abre direto, com as colunas e os acentos certos.
- **Como testaram?** `mvnw test`: 22 testes de ponta a ponta (saldo, filtros por conta/categoria/mês/texto,
  transferência, fixos, limite, planilha, login, cookie, CSRF e isolamento entre usuários).
