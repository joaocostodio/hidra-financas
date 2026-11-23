# Cadastro de categorias

# Estrutura
Grade com as categorias do usuário (ícone + descrição)
Botão para incluir nova categoria (com ícone)
Em cada categoria, link "Ver transações"

# Comportamentos
Quando abrir o componente, então listar as categorias do usuário (em ordem alfabética)
Quando clicar sobre uma categoria então detalhar
Quando clicar em nova, então abrir form para cadastrar
Quando carregar detalhamento mostrar a descrição, permitir excluir e salvar
Quando salvar então atualizar a categoria (a API recusa nome repetido)
Quando excluir então remover o registro (a API recusa se estiver em uso)
Quando clicar em "Ver transações" então abrir a lista filtrada por essa categoria

# API
Apis: http://localhost:8090/categorias
Estrutura: id (numero), descricao (string)
