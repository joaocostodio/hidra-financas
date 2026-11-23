# Anotar (janela de nova movimentação / editar)

# Estrutura
Botão fixo "+ Anotar" no canto de todas as telas do sistema
Janela:
- Topo: "Saiu" / "Entrou" e botão fechar
- Valor em destaque (R$ grande), com o cursor já nele; aceita "25,90", "1.500,00" ou "7.5"
- "Com o quê?" (saiu) ou "De onde veio?" (entrou): categorias como ícones para tocar + "Nova"
- Descrição (opcional)
- "Saiu de" / "Entrou em": a conta (já vem a última usada; se não houver, a primeira)
- Quando: Hoje / Ontem / Outro dia (mostra o calendário; aceita digitar "05/09/2026" = 5 de setembro)
- "Repetir todo mês" (só ao anotar uma nova; ver fixos.md)
- Salvar (e Excluir, ao editar)

# Comportamentos
Quando clicar em "+ Anotar", então abrir a janela em "Saiu", com o dia de hoje
Quando clicar em "Saiu dinheiro" / "Entrou dinheiro" no início, então abrir já com o tipo escolhido
Quando o tipo for "Entrou", então o valor fica verde e os textos mudam
Quando clicar em "Nova" categoria, então criar ali mesmo e já deixar escolhida
Quando salvar sem descrição, então a movimentação leva o nome da categoria
Quando salvar, então mostrar "Anotado!" com a opção "Anotar outro", e as telas abertas recarregam sozinhas
Quando clicar numa movimentação (lista ou últimas do início), então abrir a mesma janela para editar
Quando for uma transferência, então só mostrar os dados e permitir excluir (as duas partes)
Quando faltar valor ou categoria, então avisar o que falta
Quando marcar "Repetir todo mês", então a API cria um fixo e lança sozinha nos próximos meses, no mesmo dia
Quando abrir uma movimentação que veio de um fixo, então avisar que ela se repete e onde parar ("Fixos")
Quando digitar a data, então ler como dia/mês/ano (o padrão do navegador leria mês/dia); data que não existe
(31/02) é recusada

# API
POST / PUT http://localhost:8090/transacoes { descricao (opcional), valor, tipo (E/S), datatransacao, contaId, categoriaId, repetir (opcional, só no POST) }
