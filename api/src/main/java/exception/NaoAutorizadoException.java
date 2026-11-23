package exception;

/** Login recusado ou sessão inválida. Vira HTTP 401. */
public class NaoAutorizadoException extends RuntimeException {
    public NaoAutorizadoException(String mensagem) {
        super(mensagem);
    }
}
