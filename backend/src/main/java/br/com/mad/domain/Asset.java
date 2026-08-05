package br.com.mad.domain;

import br.com.mad.util.UuidV7;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
public class Asset {
    public enum Category { ACAO, FII }
    @Id
    private UUID id;
    @Column(nullable = false, unique = true, length = 12)
    private String ticker;
    @Column(nullable = false, length = 180)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;
    @Column(nullable = false)
    private boolean active = true;
    @Column(precision = 19, scale = 8)
    private BigDecimal currentPrice;
    private LocalDate priceDate;

    protected Asset() {}
    public Asset(String ticker, String name, Category category, BigDecimal currentPrice) {
        this.id = UuidV7.generate();
        this.ticker = ticker;
        this.name = name;
        this.category = category;
        this.currentPrice = currentPrice;
        this.priceDate = currentPrice == null ? null : LocalDate.now();
    }
    public UUID getId() { return id; }
    public String getTicker() { return ticker; }
    public String getName() { return name; }
    public Category getCategory() { return category; }
    public boolean isActive() { return active; }
    public BigDecimal getCurrentPrice() { return currentPrice; }
    public LocalDate getPriceDate() { return priceDate; }
    public void updateCatalog(String name, Category category, boolean active) {
        this.name = name;
        this.category = category;
        this.active = active;
    }
    public void updateQuote(BigDecimal currentPrice, LocalDate priceDate) {
        this.currentPrice = currentPrice;
        this.priceDate = priceDate;
    }
    public void deactivate() { this.active = false; }
}
