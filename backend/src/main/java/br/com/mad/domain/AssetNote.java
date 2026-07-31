package br.com.mad.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "asset_note")
public class AssetNote extends AuditedEntity {
    @Id
    private UUID id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Wallet wallet;
    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    private Asset asset;
    @Column(nullable = false, length = 2000)
    private String content;

    protected AssetNote() {}
    public AssetNote(Wallet wallet, Asset asset, String content) {
        this.id = UUID.randomUUID(); this.wallet = wallet; this.asset = asset; this.content = content;
    }
    public UUID getId() { return id; }
    public Wallet getWallet() { return wallet; }
    public Asset getAsset() { return asset; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
