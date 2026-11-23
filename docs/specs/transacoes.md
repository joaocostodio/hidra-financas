# Transações

# Estrutura
Filtros: conta (select), categoria (select), tipo (todas / receitas / despesas), botão limpar
Totais do filtro: quantidade, entradas e saídas
Tabela: data, descrição (com ícone da categoria), categoria, conta, valor (+ verde para entrada, − para saída)
Botão "Nova transação"

# Comportamentos
Quando abrir o componente, então listar as transações do usuário (mais novas primeiro)
Quando mudar um filtro então buscar de novo na API e guardar o filtro na URL (?contaId=&categoriaId=&tipo=)
Quando abrir com filtro na URL (vindo do início, de contas ou de categorias) então já mostrar filtrado
Quando clicar em nova, então abrir form: tipo (receita/despesa), valor, data, descrição, conta, categoria
Quando clicar sobre uma linha então detalhar, permitir salvar e excluir
Quando a linha for uma transferência então só mostrar e permitir excluir (exclui as duas partes)

# API
Apis: http://localhost:8090/transacoes
Filtros: ?contaId= &categoriaId= &tipo=E|S
Estrutura: id, descricao, valor, tipo ("E"/"S"), datatransacao ("2026-11-23"), contaId, conta, categoriaId,
categoria, transferencia (boolean)
