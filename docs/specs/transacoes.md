# Transações (no site: Movimentações)

# Estrutura
Ações no topo: "Fixos", "Baixar planilha", "Passar entre contas" (o "+ Anotar" fica fixo no canto de todas as telas)
Filtros (num cartão):
- Mês: ‹ novembro de 2026 › (não passa do mês atual) e "Ver todos os meses" / "Só um mês"
- Procurar: texto na descrição (ex.: "uber")
- Conta (select), categoria (select), tipo (todas / entrou / saiu), botão limpar
Totais do filtro: quantidade, entradas e saídas
Tabela: data, descrição (com ícone da categoria e a marca de "fixo" quando repete todo mês), categoria, conta,
valor (+ verde para entrada, − para saída)

# Comportamentos
Quando abrir o componente, então listar as transações do mês atual (mais novas primeiro)
Quando abrir, então antes de listar a API lança os gastos/entradas fixos que já venceram (ver fixos.md)
Quando mudar um filtro então buscar de novo na API e guardar o filtro na URL (?mes=&busca=&contaId=&categoriaId=&tipo=)
Quando digitar na busca, então esperar a pessoa parar de digitar (250 ms) antes de buscar
Quando abrir com filtro na URL (vindo do início, de contas ou de categorias) então já mostrar filtrado
Quando clicar em "Ver todos os meses", então tirar o filtro de mês (na URL fica ?mes=todos)
Quando clicar em "Baixar planilha", então baixar um CSV com o que está na tela (respeita todos os filtros)
Quando clicar em "Fixos", então abrir a lista de fixos (ver fixos.md)
Quando clicar sobre uma linha então detalhar, permitir salvar e excluir (janela "Anotar", ver anotar.md)
Quando a linha for uma transferência então só mostrar e permitir excluir (exclui as duas partes)
Quando não houver nada, então dizer se é por causa dos filtros ou se não há nada anotado no mês

# Planilha (CSV)
Colunas: Data; Descrição; Categoria; Conta; Tipo; Valor
Feita para o Excel em português abrir direto: separador ";", vírgula nos centavos, data dd/mm/aaaa e BOM do UTF-8
(para os acentos aparecerem certos). Saídas vão com valor negativo: a soma da coluna Valor dá o saldo do período.
Texto que começa com = + - @ ganha um apóstrofo na frente, para o Excel não executar como fórmula (CSV injection).

# API
Apis: http://localhost:8090/transacoes
Filtros: ?contaId= &categoriaId= &tipo=E|S &mes=2026-11 &busca=texto (todos opcionais; mês em formato errado = 422)
Planilha: GET /transacoes/planilha com os mesmos filtros (text/csv, arquivo movimentacoes-2026-11.csv)
Estrutura: id, descricao, valor, tipo ("E"/"S"), datatransacao ("2026-11-23"), contaId, conta, categoriaId,
categoria, categoriaIcone, transferencia (boolean), fixa (boolean)
