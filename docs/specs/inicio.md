# Tela inicial

# Estrutura
Saudação com o primeiro nome do usuário
Botões rápidos: "Receita" e "Despesa"
Cartões: saldo geral, receitas do mês, despesas do mês, resultado do mês
Saldo por conta: um cartão por conta (descrição + saldo)
Últimas 5 transações

# Comportamentos
Quando abrir o componente, então carregar o resumo
Quando clicar no cartão de uma conta então abrir as transações filtradas por ela
Quando clicar em Receita/Despesa então abrir o form de transação com o tipo escolhido e recarregar ao salvar
Quando não houver contas então mostrar aviso com botão para cadastrar
Saldo negativo aparece em vermelho
Transferências não contam como receita nem despesa do mês

# API
Apis: GET http://localhost:8090/resumo
Estrutura: contas [{id, descricao, saldoInicial, saldo}], saldoGeral, entradasMes, saidasMes, ultimas [transações]
