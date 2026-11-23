/** Quem está logado (resposta de GET /auth/eu, /auth/login e /auth/cadastro). Nunca traz a senha nem o token. */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

/** O que a aba "Criar conta" manda para POST /auth/cadastro. */
export interface Cadastro {
  nome: string;
  email: string;
  senha: string;
}
