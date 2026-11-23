# Roteiro da apresentação

Ideia em uma frase: **é uma planilha de gastos transformada em sistema**. Cada linha é uma transação; as colunas
Conta e Categoria viram cadastros; o filtro do Excel vira o filtro da tela; as somas viram a tela inicial.

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
| 5 | **Início → Receita**: salário 3.000 no Nubank; **Despesa**: mercado 250 | `TransacaoService.lancar` e `Validar.valorPositivo` |
| 6 | **Transações**: filtrar por conta, depois por categoria | `TransacaoService.listar` (monta o `where` só com os filtros preenchidos) |
| 7 | **Transferir**: 100 do Nubank para a Carteira | `TransacaoService.transferir`: uma `S` + uma `E`, mesmo código, `@Transactional` |
| 8 | **Início**: saldo de cada conta e geral | `Conta.saldo()` = saldo inicial + entradas − saídas |
| 9 | Sair e tentar abrir `/contas` | `logadoGuard` no site e `@Authenticated` na API (401 sem cookie) |

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
- **Como testaram?** `mvnw test`: 15 testes de ponta a ponta (saldo, filtros, transferência, login, cookie,
  CSRF e isolamento entre usuários).
