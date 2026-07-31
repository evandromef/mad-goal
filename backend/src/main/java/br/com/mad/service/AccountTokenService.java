package br.com.mad.service;

import br.com.mad.domain.AccountToken;
import br.com.mad.domain.RefreshToken;
import br.com.mad.domain.User;
import br.com.mad.repository.AccountTokenRepository;
import br.com.mad.repository.RefreshTokenRepository;
import br.com.mad.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
public class AccountTokenService {
    private final AccountTokenRepository accountTokens;
    private final RefreshTokenRepository refreshTokens;
    private final SecureRandom random = new SecureRandom();

    public AccountTokenService(AccountTokenRepository accountTokens, RefreshTokenRepository refreshTokens) {
        this.accountTokens = accountTokens;
        this.refreshTokens = refreshTokens;
    }

    public String issueAccountToken(User user, AccountToken.Type type) {
        String raw = randomToken();
        Instant expiresAt = type == AccountToken.Type.EMAIL_CONFIRMATION
                ? Instant.now().plus(24, ChronoUnit.HOURS)
                : Instant.now().plus(30, ChronoUnit.MINUTES);
        accountTokens.save(new AccountToken(user, type, hash(raw), expiresAt));
        return raw;
    }

    public User consumeAccountToken(String raw, AccountToken.Type expectedType) {
        Instant now = Instant.now();
        AccountToken token = accountTokens.findByTokenHash(hash(raw))
                .filter(value -> value.getType() == expectedType && value.isUsable(now))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Token inválido ou expirado."));
        token.use(now);
        return token.getUser();
    }

    public String issueRefreshToken(User user) {
        String raw = randomToken();
        refreshTokens.save(new RefreshToken(user, hash(raw), Instant.now().plus(30, ChronoUnit.DAYS)));
        return raw;
    }

    public User rotateRefreshToken(String raw) {
        Instant now = Instant.now();
        RefreshToken token = refreshTokens.findByTokenHash(hash(raw))
                .filter(value -> value.isUsable(now))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sessão expirada."));
        token.revoke(now);
        return token.getUser();
    }

    public void revokeRefreshToken(String raw) {
        refreshTokens.findByTokenHash(hash(raw)).ifPresent(token -> token.revoke(Instant.now()));
    }

    public void revokeAllRefreshTokens(User user) {
        Instant now = Instant.now();
        refreshTokens.findByUserIdAndRevokedAtIsNull(user.getId()).forEach(token -> token.revoke(now));
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            return java.util.HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
