package br.com.mad.util;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UuidV7Test {
    private static final long TIMESTAMP_MASK = 0x0000FFFFFFFFFFFFL;

    @Test
    void geraUuidV7ComVarianteRfcETimestampAtual() {
        long before = System.currentTimeMillis();

        UUID uuid = UuidV7.generate();

        long after = System.currentTimeMillis();
        long timestamp = (uuid.getMostSignificantBits() >>> 16) & TIMESTAMP_MASK;
        assertThat(uuid.version()).isEqualTo(7);
        assertThat(uuid.variant()).isEqualTo(2);
        assertThat(timestamp).isBetween(before, after);
    }

    @Test
    void geraIdentificadoresUnicosEmSequencia() {
        Set<UUID> generated = new HashSet<>();

        for (int index = 0; index < 10_000; index++) {
            generated.add(UuidV7.generate());
        }

        assertThat(generated).hasSize(10_000)
                .allMatch(uuid -> uuid.version() == 7 && uuid.variant() == 2);
    }
}
