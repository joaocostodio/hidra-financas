# Cadastro de categorias

# Estrutura
Grade com as categorias do usuário (ícone + descrição; "Até R$ 300,00 por mês" quando tem limite)
Botão para incluir nova categoria (com ícone)
Em cada categoria, link "Ver movimentações"

Form (diálogo):
- Prévia de como a categoria vai aparecer (ícone + nome), atualizada enquanto digita/escolhe
- Nome
- Limite por mês (opcional): "Ex.: 800,00"; o início avisa quando os gastos chegam perto ou passam
- "Escolha um ícone": grade com 30 ícones (comida, mercado, casa, carro, pets, salário...), com o nome de cada
  um ao passar o mouse; o escolhido fica verde

# Comportamentos
Quando abrir o componente, então listar as categorias do usuário (em ordem alfabética), cada uma com seu ícone
Quando clicar sobre uma categoria então detalhar
Quando clicar em nova, então abrir form para cadastrar (ícone inicial: etiqueta)
Quando clicar num ícone, então marcar como escolhido e atualizar a prévia
Quando carregar detalhamento mostrar nome, limite e ícone, permitir excluir e salvar
Quando salvar então atualizar a categoria (a API recusa nome repetido e limite negativo)
Quando o limite ficar vazio ou 0, então a categoria fica sem limite
Quando excluir então remover o registro (a API recusa se estiver em uso em movimentações ou fixos)
Quando clicar em "Ver movimentações" então abrir a lista filtrada por essa categoria (todos os meses)
O ícone da categoria também aparece nas transações e no início

# API
Apis: http://localhost:8090/categorias
Estrutura: id (numero), descricao (string), icone (string: nome do ícone no Material Symbols, ex.: "pets"),
limiteMensal (numero ou null)
As 7 categorias padrão já vêm com ícone; sem ícone, a API usa "sell" (etiqueta)
