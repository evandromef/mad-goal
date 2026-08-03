package br.com.mad.util;

import java.security.SecureRandom;
import java.util.UUID;

/** Gera UUIDv7 conforme o layout definido pela RFC 9562. */
public final class UuidV7 {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long TIMESTAMP_MASK = 0x0000FFFFFFFFFFFFL;
    private static final long VERSION_7 = 0x7000L;
    private static final long VARIANT_2 = 0x8000000000000000L;
    private static final long VARIANT_CLEAR_MASK = 0x3FFFFFFFFFFFFFFFL;

    private UuidV7() {}

    public static UUID generate() {
        long timestamp = System.currentTimeMillis() & TIMESTAMP_MASK;
        long randomA = RANDOM.nextInt(1 << 12);
        long mostSignificantBits = (timestamp << 16) | VERSION_7 | randomA;
        long leastSignificantBits = (RANDOM.nextLong() & VARIANT_CLEAR_MASK) | VARIANT_2;
        return new UUID(mostSignificantBits, leastSignificantBits);
    }
}
