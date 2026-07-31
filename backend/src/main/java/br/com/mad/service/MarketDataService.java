package br.com.mad.service;

import br.com.mad.domain.Asset;
import br.com.mad.repository.AssetRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.HashSet;
import java.util.Set;

@Service
public class MarketDataService {
    private static final Logger log = LoggerFactory.getLogger(MarketDataService.class);
    private static final ZoneId MARKET_ZONE = ZoneId.of("America/Sao_Paulo");
    private final AssetRepository assets;
    private final RestClient client;
    private final boolean enabled;

    public MarketDataService(AssetRepository assets, RestClient.Builder builder,
                             @Value("${app.market-data.base-url}") String baseUrl,
                             @Value("${app.market-data.token:}") String token,
                             @Value("${app.market-data.enabled:true}") boolean enabled) {
        this.assets = assets;
        RestClient.Builder configured = builder.baseUrl(baseUrl);
        if (!token.isBlank()) configured.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        this.client = configured.build();
        this.enabled = enabled;
    }

    @Transactional
    public int synchronizeCatalog() {
        if (!enabled) return 0;
        JsonNode response = client.get().uri("/api/quote/list?limit=1000").retrieve().body(JsonNode.class);
        if (response == null || !response.path("stocks").isArray()) return 0;
        int synchronizedCount = 0;
        Set<String> eligibleTickers = new HashSet<>();
        for (JsonNode item : response.path("stocks")) {
            Asset.Category category = category(item);
            String ticker = item.path("stock").asText("").trim().toUpperCase(Locale.ROOT);
            if (ticker.isBlank() || category == null || !available(item)) continue;
            eligibleTickers.add(ticker);
            String name = item.path("name").asText(ticker).trim();
            BigDecimal close = item.path("close").isNumber() ? item.path("close").decimalValue() : null;
            Asset asset = assets.findByTickerIgnoreCase(ticker)
                    .orElseGet(() -> new Asset(ticker, name, category, close));
            asset.updateCatalog(name.isBlank() ? ticker : name, category, true);
            if (close != null) asset.updateQuote(close, LocalDate.now(MARKET_ZONE));
            assets.save(asset);
            synchronizedCount++;
        }
        assets.findAll().stream()
                .filter(asset -> !eligibleTickers.contains(asset.getTicker().toUpperCase(Locale.ROOT)))
                .filter(Asset::isActive)
                .forEach(asset -> {
                    asset.deactivate();
                    assets.save(asset);
                });
        log.info("Catálogo sincronizado com {} ativos elegíveis", synchronizedCount);
        return synchronizedCount;
    }

    @Transactional
    public int updateReferencedQuotes() {
        if (!enabled) return 0;
        int updated = 0;
        for (Asset asset : assets.findReferencedAssets()) {
            try {
                JsonNode response = client.get()
                        .uri(uri -> uri.path("/api/v2/stocks/quote")
                                .queryParam("symbols", asset.getTicker()).build())
                        .retrieve().body(JsonNode.class);
                JsonNode result = response == null ? null : response.path("results").path(0);
                JsonNode data = result == null ? null : result.path("data");
                if (data != null && data.path("regularMarketPrice").isNumber()) {
                    BigDecimal price = data.path("regularMarketPrice").decimalValue();
                    LocalDate date = quoteDate(data.path("regularMarketTime").asText(null));
                    asset.updateQuote(price, date);
                    assets.save(asset);
                    updated++;
                }
            } catch (RuntimeException exception) {
                log.warn("Falha ao atualizar {}. Mantendo a última cotação válida: {}",
                        asset.getTicker(), exception.getMessage());
            }
        }
        return updated;
    }

    @Async
    public void synchronizeCatalogSafely() {
        try {
            synchronizeCatalog();
        } catch (RuntimeException exception) {
            log.warn("Falha na sincronização do catálogo. Catálogo local preservado: {}", exception.getMessage());
        }
    }

    @Scheduled(cron = "${app.market-data.catalog-cron:0 0 3 * * SUN}", zone = "America/Sao_Paulo")
    public void scheduledCatalogSynchronization() {
        synchronizeCatalogSafely();
    }

    @Scheduled(cron = "${app.market-data.quote-cron:0 0 20 * * MON-FRI}", zone = "America/Sao_Paulo")
    public void scheduledQuoteUpdate() {
        try {
            int updated = updateReferencedQuotes();
            log.info("{} cotações referenciadas atualizadas", updated);
        } catch (RuntimeException exception) {
            log.warn("Falha geral na atualização de cotações: {}", exception.getMessage());
        }
    }

    private Asset.Category category(JsonNode item) {
        String type = item.path("type").asText("").toLowerCase(Locale.ROOT);
        String subType = item.path("subType").asText("").toLowerCase(Locale.ROOT);
        if ("fii".equals(subType) || ("fund".equals(type) && item.path("stock").asText("").endsWith("11")))
            return Asset.Category.FII;
        if ("stock".equals(type) && ("stock".equals(subType) || "unit".equals(subType) || subType.isBlank()))
            return Asset.Category.ACAO;
        return null;
    }

    private boolean available(JsonNode item) {
        for (String field : new String[]{"active", "isActive", "available", "isAvailable", "isActivelyTrading"}) {
            if (item.has(field) && item.path(field).isBoolean() && !item.path(field).asBoolean()) return false;
        }
        return true;
    }

    private LocalDate quoteDate(String timestamp) {
        if (timestamp == null || timestamp.isBlank()) return LocalDate.now(MARKET_ZONE);
        try {
            return Instant.parse(timestamp).atZone(MARKET_ZONE).toLocalDate();
        } catch (RuntimeException ignored) {
            return LocalDate.now(MARKET_ZONE);
        }
    }
}
