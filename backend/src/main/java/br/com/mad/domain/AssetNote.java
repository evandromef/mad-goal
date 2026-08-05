package br.com.mad.domain;

import br.com.mad.util.UuidV7;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
        this.id = UuidV7.generate();
        this.wallet = wallet;
        this.asset = asset;
        this.content = content;
    }
    public UUID getId() { return id; }
    public Wallet getWallet() { return wallet; }
    public Asset getAsset() { return asset; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
