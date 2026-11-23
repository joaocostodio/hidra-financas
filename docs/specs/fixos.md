# Fixos (gastos e entradas que se repetem todo mês)

Aluguel, salário, academia, internet... coisas que acontecem todo mês no mesmo dia. Em vez de anotar de novo
todo mês, a pessoa anota uma vez com "Repetir todo mês" e o sistema lança sozinho.

# Estrutura
Na janela "Anotar" (só ao anotar uma nova): chave "Repetir todo mês (aluguel, salário, academia...)"
Ao abrir uma movimentação que veio de um fixo: aviso "Este é um fixo: se repete todo mês"
Na lista de movimentações: ícone de "repetir" ao lado da descrição
Janela "Fixos" (botão em Movimentações):
- Explicação curta de como criar
- Lista: ícone da categoria, descrição, "Todo dia 10 · Nubank · próxima em 10/12/2026", valor, botão "Parar"
- Vazio: "Nenhum fixo ainda. Ex.: aluguel, salário, academia."

# Comportamentos
Quando anotar com "Repetir todo mês", então lançar a transação e criar o fixo; a próxima é no mesmo dia do mês seguinte
Quando o dia não existir no mês (31 em fevereiro, abril...), então lançar no último dia daquele mês
Quando o Início ou as Movimentações abrirem, então lançar tudo o que já venceu até hoje
Quando a pessoa ficar meses sem abrir, então lançar todos os meses que faltaram (um por mês, na data certa)
Quando duas telas pedirem ao mesmo tempo, então lançar uma vez só (a linha do fixo fica travada no banco)
Quando clicar em "Parar" e confirmar, então o fixo deixa de existir; o que já foi lançado continua (é passado)
Quando a conta ou a categoria tiver um fixo, então não deixar excluir (422) até parar o fixo

# Por que não tem tarefa agendada (cron)?
O sistema lança "sob demanda": na hora em que a pessoa abre o Início ou as Movimentações. O resultado é o mesmo
(ninguém vê a lista sem antes ela ser atualizada), e não precisa de um processo rodando sozinho no servidor.

# API
POST http://localhost:8090/transacoes { ..., repetir: true } → lança e cria o fixo
GET  http://localhost:8090/fixas → [{ id, descricao, valor, tipo, dia, proxima, contaId, conta, categoriaId, categoria, categoriaIcone }]
DELETE http://localhost:8090/fixas/{id} → para de repetir (204)

# Código
API: entity/TransacaoFixa.java (gerarAte, noDia), service/FixaService.java (criarAPartirDe, gerarPendentes, excluir),
controller/FixaController.java. Teste: FinancasTest.fixoSeRepeteTodoMes
Site: pages/transacoes/componentes/fixas-dialog, chave "repetir" em transacao-dialog
