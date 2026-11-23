# Cadastro de contas

# Estrutura
Lista de contas cadastradas (permitir ordenar): mostrar descrição, saldo inicial e saldo atual
Saldo geral (soma de todas) no topo da lista
Botão para incluir nova conta (com ícone)

# Comportamentos
Quando abrir o componente, então listar as contas do usuário
Quando clicar sobre uma linha então detalhar
Quando clicar em nova, então abrir form para cadastrar
Quando carregar detalhamento mostrar os dados cadastrados e o saldo atual, permitir excluir e salvar
Quando salvar então atualizar os dados da conta
Quando excluir então remover o registro (a API recusa se a conta tiver transações)
Quando clicar em "Transações" então abrir a lista de transações filtrada por essa conta

# API
Apis: http://localhost:8090/contas
Estrutura: id (numero), descricao (string), saldoInicial (numero), saldo (numero, calculado)
