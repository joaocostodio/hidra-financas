package config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** As regras das chaves do JWT na nuvem que não precisam de banco. */
class ChavesDaNuvemTest {

    @Test
    void parGeradoEValido() {
        String[] par = ChavesDaNuvem.gerarPar();
        assertTrue(ChavesDaNuvem.validas(par[0], par[1]));
    }

    @Test
    void chaveCortadaNaCopiaEInvalida() {
        String[] par = ChavesDaNuvem.gerarPar();
        // O que aconteceu no Render: a primeira letra sumiu ao copiar e colar
        assertFalse(ChavesDaNuvem.validas(par[0].substring(1), par[1]));
        assertFalse(ChavesDaNuvem.validas(null, par[1]));
    }

    @Test
    void limpaFormatoPemEEspacos() {
        String[] par = ChavesDaNuvem.gerarPar();
        String pem = "-----BEGIN PRIVATE KEY-----\n" + par[0].substring(0, 64) + "\n" + par[0].substring(64)
                + "\n-----END PRIVATE KEY-----\n";
        assertEquals(par[0], ChavesDaNuvem.limpar(" " + pem));
        assertNull(ChavesDaNuvem.limpar("   "));
    }

    @Test
    void semDatabaseUrlNaoFazNada() {
        String[] par = ChavesDaNuvem.gerarPar();
        ChavesDaNuvem fonte = new ChavesDaNuvem(null, par[0], par[1]);
        assertTrue(fonte.getPropertyNames().isEmpty());
        assertNull(fonte.getValue(ChavesDaNuvem.ASSINAR));
    }
}
