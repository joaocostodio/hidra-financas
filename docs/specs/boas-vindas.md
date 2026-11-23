# Boas-vindas (primeiro acesso)

# Estrutura
Título: "Olá, <nome>! Onde você guarda seu dinheiro?"
Botões prontos (chips) com os lugares mais comuns: Carteira, Nubank, Itaú, Bradesco, Banco do Brasil, Caixa,
Inter, Santander, Poupança
Campo "Outro lugar" + botão Adicionar
Lista "Quanto tem em cada um hoje?": nome do lugar, valor em R$, botão para tirar
Rodapé: "Pular por enquanto" e "Começar a usar"

# Comportamentos
Quando criar a conta, então abrir esta tela
Quando tocar num botão pronto, então marcar (verde) e incluir na lista; tocar de novo desmarca
Quando adicionar outro lugar, então incluir na lista
Quando clicar em "Começar a usar", então cadastrar uma conta para cada lugar, com o valor como saldo inicial
(valor vazio = R$ 0,00), e ir para o início
Quando clicar em "Pular por enquanto", então ir para o início sem cadastrar nada

# API
POST http://localhost:8090/contas { descricao, saldoInicial } (uma chamada por lugar)
