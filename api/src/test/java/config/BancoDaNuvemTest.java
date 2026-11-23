package config;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** A tradução do DATABASE_URL (formato do Neon) para as propriedades do Quarkus. Não precisa de banco. */
class BancoDaNuvemTest {

    @Test
    void traduzEnderecoDoNeon() {
        Map<String, String> c = BancoDaNuvem.traduzir(
                "postgresql://neondb_owner:npg_Abc123@ep-cool-name-a1b2c3d4-pooler.us-east-1.aws.neon.tech/neondb"
                        + "?sslmode=require&channel_binding=require");
        // Conexão direta (sem "-pooler"), mantendo o sslmode e descartando o resto
        assertEquals("jdbc:postgresql://ep-cool-name-a1b2c3d4.us-east-1.aws.neon.tech/neondb?sslmode=require",
                c.get("quarkus.datasource.jdbc.url"));
        assertEquals("neondb_owner", c.get("quarkus.datasource.username"));
        assertEquals("npg_Abc123", c.get("quarkus.datasource.password"));
    }

    @Test
    void mantemPortaESenhaComCaracteresEspeciais() {
        Map<String, String> c = BancoDaNuvem.traduzir("postgres://ana:s%40nh%3Aa@db.exemplo.com:6543/financas");
        assertEquals("jdbc:postgresql://db.exemplo.com:6543/financas?sslmode=require", c.get("quarkus.datasource.jdbc.url"));
        assertEquals("s@nh:a", c.get("quarkus.datasource.password"));
    }

    @Test
    void semVariavelNaoMudaNada() {
        assertTrue(new BancoDaNuvem(null).getProperties().isEmpty());
        assertTrue(new BancoDaNuvem("  ").getProperties().isEmpty());
    }

    @Test
    void recusaEnderecoQueNaoEPostgres() {
        assertThrows(IllegalArgumentException.class, () -> BancoDaNuvem.traduzir("mysql://u:s@h/db"));
    }
}
