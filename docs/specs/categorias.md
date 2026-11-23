# Cadastro de categorias

# Estrutura
Grade com as categorias do usuário (ícone + descrição)
Botão para incluir nova categoria (com ícone)
Em cada categoria, link "Ver transações"

Form (diálogo):
- Prévia de como a categoria vai aparecer (ícone + nome), atualizada enquanto digita/escolhe
- Nome
- "Escolha um ícone": grade com 30 ícones (comida, mercado, casa, carro, pets, salário...), com o nome de cada
  um ao passar o mouse; o escolhido fica verde

# Comportamentos
Quando abrir o componente, então listar as categorias do usuário (em ordem alfabética), cada uma com seu ícone
Quando clicar sobre uma categoria então detalhar
Quando clicar em nova, então abrir form para cadastrar (ícone inicial: etiqueta)
Quando clicar num ícone, então marcar como escolhido e atualizar a prévia
Quando carregar detalhamento mostrar nome e ícone, permitir excluir e salvar
Quando salvar então atualizar a categoria (a API recusa nome repetido)
Quando excluir então remover o registro (a API recusa se estiver em uso)
Quando clicar em "Ver transações" então abrir a lista filtrada por essa categoria
O ícone da categoria também aparece nas transações e no início

# API
Apis: http://localhost:8090/categorias
Estrutura: id (numero), descricao (string), icone (string: nome do ícone no Material Symbols, ex.: "pets")
As 7 categorias padrão já vêm com ícone; sem ícone, a API usa "sell" (etiqueta)
