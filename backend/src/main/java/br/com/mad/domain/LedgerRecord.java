package br.com.mad.domain;

import br.com.mad.util.UuidV7;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ledger_record")
public class LedgerRecord extends AuditedEntity {
    public enum Type { COMPRA, VENDA, SUBSCRICAO, DIVIDENDO, JCP, BONIFICACAO, DESDOBRAMENTO, GRUPAMENTO }
    @Id
    private UUID id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Wallet wallet;
    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    private Asset asset;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;
    @Column(name = "event_date", nullable = false)
    private LocalDate date;
    @Column(precision = 19, scale = 8)
    private BigDecimal quantity;
    @Column(precision = 19, scale = 8)
    private BigDecimal unitPrice;
    @Column(precision = 19, scale = 8)
    private BigDecimal fees;
    @Column(precision = 19, scale = 8)
    private BigDecimal totalValue;
    @Column(precision = 19, scale = 8)
    private BigDecimal newQuantity;
    @Column(length = 30)
    private String ratio;
    @Column(length = 500)
    private String description;

    protected LedgerRecord() {}
    public LedgerRecord(Wallet wallet, Asset asset) {
        this.id = UuidV7.generate();
        this.wallet = wallet;
        this.asset = asset;
    }
    public void update(Type type, LocalDate date, BigDecimal quantity, BigDecimal unitPrice,
                       BigDecimal fees, BigDecimal totalValue, BigDecimal newQuantity,
                       String ratio, String description) {
        this.type = type; this.date = date; this.quantity = quantity; this.unitPrice = unitPrice;
        this.fees = fees; this.totalValue = totalValue; this.newQuantity = newQuantity;
        this.ratio = ratio; this.description = description;
    }
    public UUID getId() { return id; }
    public Wallet getWallet() { return wallet; }
    public Asset getAsset() { return asset; }
    public Type getType() { return type; }
    public LocalDate getDate() { return date; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getFees() { return fees; }
    public BigDecimal getTotalValue() { return totalValue; }
    public BigDecimal getNewQuantity() { return newQuantity; }
    public String getRatio() { return ratio; }
    public String getDescription() { return description; }
}
