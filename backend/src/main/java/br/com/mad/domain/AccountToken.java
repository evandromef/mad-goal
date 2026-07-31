package br.com.mad.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_token")
public class AccountToken {
    public enum Type { EMAIL_CONFIRMATION, PASSWORD_RESET }

    @Id
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "used_at")
    private Instant usedAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AccountToken() {}
    public AccountToken(User user, Type type, String tokenHash, Instant expiresAt) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.type = type;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }
    public User getUser() { return user; }
    public Type getType() { return type; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isUsable(Instant now) { return usedAt == null && expiresAt.isAfter(now); }
    public void use(Instant now) { usedAt = now; }
}
