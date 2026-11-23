# Entrar e criar conta

# Estrutura
Tela dividida em duas partes:
- Esquerda: marca, frase do que é o app e 3 passos ("Diga onde tem dinheiro", "Anote o que entra e sai", "Veja quanto você tem")
- Direita: cartão com abas "Entrar" e "Criar conta"
Botão para trocar entre tema claro e escuro (canto superior direito)

Entrar: e-mail, senha (com botão de mostrar), botão "Entrar", link "Criar uma conta grátis"
Criar conta: seu nome, e-mail, crie uma senha, lista de regras da senha que vai marcando enquanto digita
(pelo menos 8 caracteres, uma letra, um número), botão "Criar minha conta", link "Entrar"

# Comportamentos
Quando abrir /entrar, então mostrar a aba Entrar; quando abrir /cadastro, a aba Criar conta
Quando trocar de aba, então trocar a URL sem recarregar a tela
Quando digitar a senha nova, então marcar em verde as regras já cumpridas
Quando entrar com sucesso, então ir para o início
Quando criar a conta com sucesso, então ir para o passo a passo (boas-vindas)
Quando a API recusar, então mostrar a mensagem dela (ex.: "E-mail ou senha incorretos")
Quando a sessão vencer, então voltar para cá com o aviso "Por segurança, sua sessão terminou"
No celular: some a lista de passos, fica só a frase e o cartão

# API
POST http://localhost:8090/auth/login    { email, senha }
POST http://localhost:8090/auth/cadastro { nome, email, senha }
Resposta: { id, nome, email } + cookie httpOnly financas_sessao (o token JWT)
