# Hidra Finanças

Software de **gestão financeira pessoal** feito com **Quarkus** e **Angular**: uma "planilha de gastos" em forma de
sistema. Você cadastra suas contas (Nubank, Carteira, Poupança...), lança receitas e despesas com categoria,
transfere entre as contas e vê o saldo de cada uma e o geral.

Projeto da disciplina de **Programação Orientada a Objetos** — EC04 / 2026 — SETREM.
Baseado nos projetos de aula [finance-api](https://github.com/tiagoseibel/finance-api) e
[finance-ui](https://github.com/tiagoseibel/finance-ui).

## O que foi pedido × onde está

| Pedido | Onde está |
|---|---|
| Quarkus e Angular | `api/` (Quarkus + Panache + PostgreSQL) e `web/` (Angular 22 + Angular Material) |
| Lançamento de contas | Tela **Contas**: cadastrar, editar e excluir, com saldo inicial — `/contas` |
| Categorias | Tela **Categorias** (cada usuário tem as suas; 7 prontas no cadastro) — `/categorias` |
| Transações | Receitas (E) e despesas (S): lançar, editar e excluir — `/transacoes` |
| Transações filtradas por categoria e conta | Tela **Transações** com filtros — `GET /transacoes?contaId=&categoriaId=` |
| Transferência entre contas | Tela **Transferir** — `POST /transacoes/transferencia` (uma saída + uma entrada) |
| Tela inicial com saldo por conta e geral | Tela **Início** — `GET /resumo` |
| Autenticação JWT em cookie httpOnly | `AuthController` + `CookieSessao`: o token vai no cookie `financas_sessao` (HttpOnly, SameSite=Strict) |

## Como executar

Requisitos: **Docker** (para o PostgreSQL), **JDK 21** e **Node.js 22+**.

```bash
# 1. Banco de dados (PostgreSQL 17 em localhost:5434)
docker compose up -d

# 2. API (Quarkus) em http://localhost:8090 — cria as tabelas sozinha
cd api
./mvnw quarkus:dev          # no Windows: mvnw.cmd quarkus:dev

# 3. Site (Angular) em http://localhost:4200 — em outro terminal
cd web
npm install
npm start
```

Abra **http://localhost:4200**, clique em **Criar cadastro** e pronto: você já entra logado e com as categorias padrão.

As portas (8090, 4200 e 5434) são diferentes das do banco-hidra (8080, 4300 e 5433): os dois projetos rodam ao mesmo tempo.

### Testes da API

Sobem um PostgreSQL descartável sozinhos (pelo Docker):

```bash
cd api
./mvnw test                 # 14 testes: saldo, filtros, transferência, login, cookie, CSRF, isolamento entre usuários
```

### Compilar para produção

```bash
cd api && ./mvnw package    # gera api/target/quarkus-app/quarkus-run.jar
cd web && npm run build     # gera web/dist/web
```

Em produção o token precisa de chaves RSA próprias (em dev o Quarkus gera sozinho). Elas **não** vão para o Git:

```bash
mkdir -p api/chaves
openssl genrsa -out api/chaves/privada.pem 2048
openssl rsa -in api/chaves/privada.pem -pubout -out api/chaves/publica.pem
```

## Estrutura

```
hidra-financas/
├── api/                        Quarkus (porta 8090)
│   └── src/main/java/
│       ├── entity/             Usuario, Conta, Categoria, Transacao (Panache)
│       ├── service/            regras de negócio (TransacaoService, ContaService, ...)
│       ├── controller/         rotas REST
│       ├── dto/                o que entra e sai da API (records)
│       ├── security/           cookie da sessão, proteção CSRF, usuário logado
│       └── exception/          erros de regra → HTTP 422 / 404 / 401
├── web/                        Angular 22 + Material (porta 4200)
│   └── src/app/
│       ├── common/             login (auth), layout com menu lateral, componentes reutilizáveis
│       └── pages/<funcionalidade>/{model, services, routes, componentes}
├── docs/specs/                 especificação de cada tela
├── docs/apresentacao.md        roteiro da apresentação
└── docker-compose.yml          PostgreSQL
```

O site segue as instruções da disciplina (`web/.github/instructions/projeto-angular.instructions.md`): só CSS,
**signals**, **reactive forms**, HTML e CSS fora do TypeScript, componentes do **Angular Material** e a estrutura
`pages/<funcionalidade>/{model,services,routes,componentes}`.

## Modelo de dados

| Entidade | Campos |
|---|---|
| `Usuario` | nome, email (único), senhaHash (BCrypt) |
| `Conta` | descricao, saldoInicial, usuario |
| `Categoria` | descricao, usuario |
| `Transacao` | descricao, valor, tipo (`E` entrada / `S` saída), datatransacao, conta, categoria, transferencia |

- **Saldo** de uma conta = saldo inicial + entradas − saídas (método `Conta.saldo()`). O sistema não guarda o saldo:
  ele é calculado a partir das transações, como numa planilha.
- **Transferência** = duas transações com o mesmo código (`transferencia`): uma `S` na conta de origem e uma `E` na
  de destino, gravadas juntas (`@Transactional`: ou grava as duas, ou nenhuma). Excluir uma exclui as duas.
  Transferência não tem categoria e não conta como receita ou despesa no resumo do mês.

## Conceitos de POO no código

- **Encapsulamento**: em `Usuario` a senha é `private` e só entra por `definirSenha()` (grava o hash BCrypt) e só é
  conferida por `senhaConfere()`. Ninguém lê nem grava a senha direto.
- **Herança**: todas as entidades herdam de `PanacheEntity` (ganham `id`, `persist()`, `delete()`, `find()`...).
  As exceções de regra herdam de `RuntimeException`.
- **Responsabilidade de cada objeto**: a `Conta` sabe calcular o próprio saldo (`saldo()`) e dizer se tem transações
  (`temTransacoes()`); a `Transacao` sabe se é transferência (`ehTransferencia()`).
- **Camadas**: controller (HTTP) → service (regras) → entity (dados). O controller nunca tem regra de negócio.

## Segurança

- **JWT em cookie httpOnly**: no login/cadastro a API gera um JWT assinado (RSA, 1 hora) e devolve no cookie
  `financas_sessao` com `HttpOnly` (o JavaScript não lê: um script injetado não rouba a sessão) e `SameSite=Strict`
  (outro site não consegue usá-lo). O token nunca aparece no corpo da resposta nem no `localStorage`.
  O Quarkus lê o token do cookie (`mp.jwt.token.cookie` no `application.properties`).
- **CSRF**: toda requisição que muda dados exige o cabeçalho `X-Requested-With` (`ProtecaoCsrf`), que o site manda
  em todas as chamadas (`auth.interceptor.ts`).
- **Cada um só vê o que é seu**: o dono vem sempre do token (`UsuarioLogado`), nunca do corpo da requisição.
  Conta, categoria ou transação de outra pessoa responde **404**.
- **Senha**: 8 a 72 caracteres, com letras e números; guardada só como hash BCrypt. E-mail inexistente e senha
  errada dão a mesma mensagem (não revela quem tem cadastro).

## API

Todas as rotas (menos cadastro e login) exigem o cookie de sessão. Erros voltam como `{"erro": "mensagem"}`:
**422** regra de negócio, **404** não encontrado, **401** sem login, **403** sem o cabeçalho `X-Requested-With`.

| Método | Rota | O que faz |
|---|---|---|
| POST | `/auth/cadastro` | `nome`, `email`, `senha` → cria o usuário e já abre a sessão |
| POST | `/auth/login` | `email`, `senha` → grava o cookie de sessão |
| POST | `/auth/sair` | Apaga o cookie |
| GET | `/auth/eu` | Quem está logado |
| GET / POST | `/contas` | Lista (com saldo) / cria (`descricao`, `saldoInicial`) |
| GET / PUT / DELETE | `/contas/{id}` | Busca / atualiza / exclui (só sem transações) |
| GET / POST | `/categorias` | Lista / cria (`descricao`) |
| GET / PUT / DELETE | `/categorias/{id}` | Busca / atualiza / exclui (só se não estiver em uso) |
| GET | `/transacoes?contaId=&categoriaId=&tipo=` | Lista com filtros opcionais |
| POST | `/transacoes` | Lança: `descricao`, `valor`, `tipo` (E/S), `datatransacao`, `contaId`, `categoriaId` |
| GET / PUT / DELETE | `/transacoes/{id}` | Busca / atualiza / exclui |
| POST | `/transacoes/transferencia` | `origemId`, `destinoId`, `valor`, `datatransacao`, `descricao` |
| GET | `/resumo` | Saldo de cada conta, saldo geral, receitas/despesas do mês e últimas transações |
