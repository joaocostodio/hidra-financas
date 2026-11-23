package exception;

/** Uma regra de negócio foi quebrada (valor zerado, conta com transações...). Vira HTTP 422. */
public class RegraException extends RuntimeException {
    public RegraException(String mensagem) {
        super(mensagem);
    }
}
