# Site no ar: funcionamento, limites e o que fazer se algo der errado

Endereço: <https://hidra-financas.onrender.com>

Este documento explica como a versão publicada se comporta no plano gratuito (o que é normal, o que pode dar
problema e como resolver). Como ela é montada: [hospedagem-render.md](hospedagem-render.md).

> A apresentação do trabalho é no notebook (ver [README](../README.md)) e não depende de nada disto.
> O site no ar é um extra, para o sistema poder ser usado de qualquer lugar.

## Resumo

| Pergunta | Resposta |
|---|---|
| Sempre abre? | Sim. No primeiro acesso depois de um tempo parado ele **demora**, mas não trava |
| Quanto demora? | Uns 30 a 60 segundos no primeiro acesso após 15 min sem uso; depois disso, na hora |
| Os dados somem? | Não. Ficam no banco Neon, que não expira no plano gratuito |
| O login cai quando o servidor dorme? | Não. As chaves do login ficam guardadas no banco (vale 1 hora, como no notebook) |
| Custa alguma coisa? | Não. Render e Neon no plano gratuito, sem cartão |

## O que é normal

### A tela de espera do Render

O servidor gratuito do Render **dorme depois de 15 minutos sem nenhum acesso**. No próximo acesso, em vez do site,
aparece por alguns segundos uma tela preta do Render com mensagens como:

```
INCOMING HTTP REQUEST DETECTED ...
SERVICE WAKING UP ...
STARTING THE INSTANCE ...
YOUR APP IS ALMOST LIVE ...
```

Isso **não é erro**: é o servidor ligando (em testes levou cerca de 30 segundos). Quando termina, o site abre
sozinho. Se a página ficar parada nessa tela, apertar **F5** resolve.

**Dica:** antes de mostrar o site para alguém (ou de mandar o link), abra-o uma vez e espere carregar. Assim a
pessoa já encontra o servidor acordado.

### O banco também "dorme"

O Neon desliga o banco depois de 5 minutos sem uso e liga de novo sozinho no próximo acesso, em menos de 1 segundo.
Isso é imperceptível. A API foi configurada para conviver com isso: não guarda conexões paradas, então nunca tenta
usar uma conexão que o Neon já fechou (`application.properties`, seção do banco no perfil `%prod`).

## Limites do plano gratuito

Valores de novembro de 2026 (os provedores podem mudar):

| Serviço | Limite | Uso esperado |
|---|---|---|
| Render (site + API) | 750 horas de servidor por mês | Um mês inteiro ligado direto são 744 h: mesmo com muito uso não estoura |
| Neon (banco) | 100 horas de processamento (CU-hora) por mês e 1 GB de dados | O banco só conta tempo enquanto está ligado (alguém usando); um trabalho de faculdade fica bem abaixo |

Se algum limite estourasse, o serviço pararia até o mês seguinte (os dados continuam guardados).

## O que pode dar errado (pouco provável) e o que fazer

| Situação | O que se vê | O que fazer |
|---|---|---|
| Servidor acordando | Tela de espera do Render | Esperar uns segundos ou apertar F5 |
| Instabilidade do Render | Página de erro do Render (raro) | Esperar alguns minutos; volta sozinho. Status: <https://status.render.com> |
| Atualização (deploy) com erro | Nada: o Render **mantém a versão anterior** no ar | Ver o log do deploy no painel do Render e corrigir |
| Erro dentro do sistema (ex.: "erro inesperado" ao salvar) | Mensagem de erro no site | Painel do Render → serviço `hidra-financas` → **Logs** (procurar por `ERROR`) |
| Limite do Neon estourado | Erro ao entrar ou salvar | Painel do Neon → **Monitoring** para ver o uso; volta no mês seguinte |

## Onde olhar

| Para quê | Onde |
|---|---|
| Ver se está no ar, logs, reiniciar | <https://dashboard.render.com> → `hidra-financas` → **Logs**; para reiniciar, **Manual Deploy → Deploy latest commit** |
| Publicar uma versão nova | `git push` na `main` e depois **Manual Deploy → Deploy latest commit** (o serviço foi ligado pelo endereço público do repositório, então não atualiza sozinho) |
| Ver os dados, rodar SQL | <https://console.neon.tech> → projeto `hidra-financas` → **Tables** ou **SQL Editor** |
| Uso do banco no mês | Neon → **Monitoring** |

## Segurança do site no ar

As mesmas proteções do notebook continuam valendo:

- **HTTPS**: o Render cuida do certificado; o cookie da sessão sai com `Secure; HttpOnly; SameSite=Strict`.
- **Cada pessoa só vê os próprios dados**: o dono vem sempre do token, nunca do que o navegador manda.
- **CSRF**: sem o cabeçalho `X-Requested-With`, qualquer alteração é recusada (403).
- **Segredos fora do Git**: a única informação secreta (`DATABASE_URL`) fica só no painel do Render; as chaves do
  login são geradas e guardadas no banco ([`ChavesDaNuvem`](../api/src/main/java/config/ChavesDaNuvem.java)).

Testado no endereço real em 23/11/2026: cadastro, login, contas, lançamentos, resumo do mês, planilha, 401 sem
login, 403 sem o cabeçalho CSRF e 401 com token falso.
