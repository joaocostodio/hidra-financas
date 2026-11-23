# Hospedagem: Render + Neon (sempre no ar, de graça)

Versão do sistema que fica num endereço fixo com HTTPS, sem depender do notebook. É um extra: o trabalho continua
rodando no notebook exatamente como no [README](../README.md).

Como ela se comporta no dia a dia (tela de espera, limites gratuitos, o que fazer se algo der errado):
[site-no-ar.md](site-no-ar.md).

| Parte | Serviço | Plano grátis |
|---|---|---|
| Site + API (um container) | [Render](https://render.com) | Endereço fixo `https://hidra-financas.onrender.com`. Dorme depois de 15 min sem acesso; o primeiro acesso depois disso leva cerca de 1 minuto |
| Banco PostgreSQL | [Neon](https://neon.com) | Não expira; 1 GB; desliga sozinho quando ninguém usa e liga na hora em que precisa |

## Como funciona

```mermaid
flowchart LR
    N([Navegador]) -->|"https://hidra-financas.onrender.com"| R
    subgraph R["Render (container do Dockerfile)"]
        Q["Quarkus<br/>/ → site Angular (META-INF/resources)<br/>/api/... → API REST"]
    end
    Q -->|"DATABASE_URL (SSL)"| D[("Neon<br/>PostgreSQL")]
```

- **Um container só** ([`Dockerfile`](../Dockerfile)): compila o Angular, coloca o resultado dentro da API
  (`META-INF/resources`) e compila a API. O Quarkus entrega o site e a API no mesmo endereço, então o cookie de
  sessão continua `SameSite=Strict` e não precisa de CORS, igual ao notebook.
- **API em `/api`** só em produção (`%prod.quarkus.rest.path=/api`), porque o site tem telas com os mesmos nomes das
  rotas (`/transacoes`, `/contas`). No notebook quem tira o `/api` é o proxy do `ng serve`.
- **F5 numa tela** (ex.: `/transacoes`) devolve o `index.html` e o Angular abre a tela certa
  ([`RotasDoSite`](../api/src/main/java/config/RotasDoSite.java), só no perfil de produção).
- **Banco**: a variável `DATABASE_URL` que o Neon fornece (`postgresql://usuario:senha@host/banco?sslmode=require`)
  é traduzida para a configuração do Quarkus por [`BancoDaNuvem`](../api/src/main/java/config/BancoDaNuvem.java)
  (testada em `BancoDaNuvemTest`). As tabelas são criadas sozinhas na primeira vez.
- **Chaves do login (JWT)**: [`ChavesDaNuvem`](../api/src/main/java/config/ChavesDaNuvem.java) gera um par RSA
  2048 na primeira vez e guarda na tabela `chave_jwt` do banco; nas próximas vezes lê de lá, então o login continua
  valendo depois que o servidor dorme e acorda. Se `JWT_CHAVE_PRIVADA`/`JWT_CHAVE_PUBLICA` existirem e forem
  válidas, usa essas; se estiverem quebradas (por exemplo, uma letra perdida ao copiar e colar), avisa no log e usa
  as do banco. Testada em `ChavesDaNuvemTest`.
- **HTTPS** é do Render; ele avisa com `X-Forwarded-Proto: https` e o cookie da sessão sai com `Secure`.
- **Segredo só no painel do Render**, nunca no Git: `DATABASE_URL`.
- **Atualizar**: o serviço foi ligado pelo endereço público do repositório, então depois de um `git push` é só clicar
  em **Manual Deploy → Deploy latest commit** no painel do Render ([`render.yaml`](../render.yaml)).

## Passo a passo (uma vez só)

### 1. Banco no Neon

1. Entrar em <https://console.neon.tech> com a conta do **GitHub**.
2. Criar um projeto: nome `hidra-financas`, Postgres 17, região **AWS US East 1 (N. Virginia)**
   (perto do Render em Virgínia).
3. Na tela do projeto, botão **Connect** → copiar a **connection string**
   (`postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require...`).

### 2. Site no Render

1. Entrar em <https://dashboard.render.com> (com a conta do GitHub ou e-mail).
2. **New → Blueprint** → em *Public Git Repository*, colar `https://github.com/joaocostodio/hidra-financas`.
   O Render lê o [`render.yaml`](../render.yaml).
3. Ele pede um valor secreto: colar a `DATABASE_URL` (a connection string do Neon).
4. **Deploy Blueprint**. A primeira montagem leva alguns minutos (compila o site e a API). Depois o endereço aparece
   no painel: `https://hidra-financas.onrender.com`.

### Depois

- Atualizar: `git push` na `main` e, no painel do Render, **Manual Deploy → Deploy latest commit**.
- Logs e reinício: painel do Render → serviço `hidra-financas` → **Logs** / **Manual Deploy**.
- Ver os dados: painel do Neon → **Tables** ou **SQL Editor**.

## Testado

Antes de subir, a mesma imagem foi testada num PC como o Render a roda (variável `PORT`, `DATABASE_URL`): site e
telas abertas direto (`/transacoes`, `/contas`) com 200, arquivos inexistentes com 404, cadastro pelo navegador,
cookie `Secure; HttpOnly; SameSite=Strict`, 7 categorias padrão criadas, 401 sem login, 403 sem o cabeçalho CSRF e
404 em rota de API inexistente. Também com uma chave do JWT quebrada de propósito (sem a primeira letra): a API avisou,
gerou as chaves no banco, o cadastro funcionou, o mesmo login continuou valendo depois de reiniciar o servidor e um
token falso foi recusado.
