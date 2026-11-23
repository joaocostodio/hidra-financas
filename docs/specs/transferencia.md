# Transferência entre contas

# Estrutura
Form: conta de origem, conta de destino (sem a origem), valor, data, descrição (opcional)
Abaixo de cada conta escolhida, mostrar o saldo dela
Botão "Transferir"

# Comportamentos
Quando o usuário tiver menos de duas contas então mostrar aviso com link para cadastrar conta
Quando escolher a origem igual ao destino então limpar o destino
Quando transferir então criar uma saída (S) na origem e uma entrada (E) no destino, limpar o form e atualizar saldos
Quando a API recusar então mostrar a mensagem de erro

# API
Apis: POST http://localhost:8090/transacoes/transferencia
Estrutura: origemId, destinoId, valor, datatransacao, descricao
