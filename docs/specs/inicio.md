# Tela inicial

# Estrutura
Saudação com o primeiro nome e botões "Saiu dinheiro" / "Entrou dinheiro"
Hoje:
- Cartão verde "Você tem hoje" (soma de todas as contas)
- "Suas contas": um cartão por conta (nome + quanto tem), com "Passar entre contas" e "Editar"
Resumo do mês (cartão):
- Navegação ‹ novembro de 2026 › (não passa do mês atual) e "Mês atual" quando estiver em outro mês
- Entrou, Saiu e Sobrou (ou "Gastou a mais") no mês
- "Para onde foi o dinheiro": gráfico de barras horizontais, uma por categoria, do maior gasto para o menor,
  com ícone, nome, valor e % do que saiu no mês
Últimas 5 movimentações

# Comportamentos
Quando abrir o componente, então carregar o resumo do mês atual
Quando trocar de mês, então carregar o resumo daquele mês (os saldos continuam sendo os de hoje)
Quando passar o mouse numa barra, então mostrar valor e % ("R$ 508,85 · 27% do que saiu em novembro")
Quando clicar numa barra, então abrir as movimentações daquela categoria
Quando clicar no cartão de uma conta, então abrir as movimentações daquela conta
Quando clicar numa das últimas movimentações, então abrir a janela para editar
Quando algo for anotado ou excluído (de qualquer tela), então recarregar sozinha
Quando não houver contas, então mostrar aviso com botão para cadastrar
Quando não houver gastos no mês, então mostrar "Nenhum gasto anotado em <mês>"
Saldo negativo aparece em vermelho
Dinheiro passado entre contas não conta como entrada nem saída do mês

# Gráfico
Feito só com HTML e CSS (sem biblioteca): barras finas (8px) com ponta arredondada, uma cor só
(é uma série só: o quanto saiu). A identificação de cada barra está no ícone e no nome escritos ao lado,
não na cor. O comprimento é relativo ao maior gasto; o % é sobre o total que saiu no mês.

# API
Apis: GET http://localhost:8090/resumo?mes=2026-11 (sem mes = mês atual; formato errado = 422)
Estrutura: mes, contas [{id, descricao, saldoInicial, saldo}], saldoGeral, entradasMes, saidasMes,
gastosPorCategoria [{categoriaId, categoria, icone, total}], ultimas [movimentações]
