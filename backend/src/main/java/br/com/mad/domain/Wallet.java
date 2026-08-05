package br.com.mad.domain;

import br.com.mad.util.UuidV7;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_wallet_user_name", columnNames = {"user_id", "name"}))
public class Wallet extends AuditedEntity {
    @Id
    private UUID id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @Column(nullable = false, length = 80)
    private String name;

    protected Wallet() {}
    public Wallet(User user, String name) {
        this.id = UuidV7.generate();
        this.user = user;
        this.name = name;
    }
    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
