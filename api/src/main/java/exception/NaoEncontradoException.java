package exception;

/** O registro não existe ou é de outro usuário (para quem pergunta, dá no mesmo). Vira HTTP 404. */
public class NaoEncontradoException extends RuntimeException {
    public NaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
