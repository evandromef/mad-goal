package br.com.mad.domain;

import jakarta.persistence.*;
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
    @Column(precision = 19, scale = 6)
    private BigDecimal currentPrice;
    private LocalDate priceDate;

    protected Asset() {}
    public Asset(String ticker, String name, Category category, BigDecimal currentPrice) {
        this.id = UUID.randomUUID();
        this.ticker = ticker;
        this.name = name;
        this.category = category;
        this.currentPrice = currentPrice;
        this.priceDate = LocalDate.now();
    }
    public UUID getId() { return id; }
    public String getTicker() { return ticker; }
    public String getName() { return name; }
    public Category getCategory() { return category; }
    public boolean isActive() { return active; }
    public BigDecimal getCurrentPrice() { return currentPrice; }
    public LocalDate getPriceDate() { return priceDate; }
}

