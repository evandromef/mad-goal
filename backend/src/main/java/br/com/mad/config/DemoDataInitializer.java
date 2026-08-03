package br.com.mad.config;

import br.com.mad.domain.Asset;
import br.com.mad.domain.LedgerRecord;
import br.com.mad.domain.User;
import br.com.mad.domain.Wallet;
import br.com.mad.repository.AssetRepository;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.repository.UserRepository;
import br.com.mad.repository.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/** Carga opcional para avaliação manual de UI/UX em ambientes locais. */
@Component
@Profile("dev")
@Order(1)
public class DemoDataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);
    private final UserRepository users;
    private final WalletRepository wallets;
    private final AssetRepository assets;
    private final LedgerRecordRepository records;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String name;
    private final String email;
    private final String password;

    public DemoDataInitializer(UserRepository users, WalletRepository wallets, AssetRepository assets,
                               LedgerRecordRepository records, PasswordEncoder passwordEncoder,
                               @Value("${app.demo-data.enabled:false}") boolean enabled,
                               @Value("${app.demo-data.name:Marina Oliveira}") String name,
                               @Value("${app.demo-data.email:demonstracao@mad.local}") String email,
                               @Value("${app.demo-data.password:Mad@12345}") String password) {
        this.users = users;
        this.wallets = wallets;
        this.assets = assets;
        this.records = records;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.name = name;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) return;

        if (users.findByEmailIgnoreCase(email).isPresent()) {
            log.info("Carga demonstrativa ignorada: o e-mail configurado já existe");
            return;
        }

        Map<String, Asset> catalog = new LinkedHashMap<>();
        assets.findByActiveTrueOrderByTicker().forEach(asset -> catalog.put(asset.getTicker(), asset));
        Map<String, BigDecimal> referencePrices = Map.of(
                "PETR4", bd("37.84"), "VALE3", bd("61.20"), "ITUB4", bd("39.15"),
                "WEGE3", bd("47.32"), "MXRF11", bd("10.12"), "HGLG11", bd("161.40"),
                "KNRI11", bd("144.75"));
        Set<String> missingTickers = new TreeSet<>(referencePrices.keySet());
        missingTickers.removeAll(catalog.keySet());
        if (!missingTickers.isEmpty()) {
            log.warn("Carga demonstrativa ignorada: ativos obrigatórios ausentes ou inativos: {}", missingTickers);
            return;
        }
        referencePrices.forEach((ticker, price) -> {
            Asset asset = requiredAsset(catalog, ticker);
            if (asset.getCurrentPrice() == null) asset.updateQuote(price, LocalDate.now());
        });

        LocalDate today = LocalDate.now();
        User user = new User(name.trim(), email.trim().toLowerCase(), passwordEncoder.encode(password));
        user.verifyEmail();
        user = users.save(user);
        Wallet wallet = wallets.save(new Wallet(user, "Carteira de longo prazo"));

        LocalDate start = today.minusYears(5);
        List<SeedRecord> history = List.of(
                buy(start, "ITUB4", "100", "24.60", "4.90", "Primeiro aporte da carteira"),
                buy(start.plusDays(12), "MXRF11", "80", "10.05", "2.10", "Início da posição em fundos imobiliários"),
                buy(start.plusMonths(2), "PETR4", "100", "27.40", "5.80", "Aporte em ações de energia"),
                buy(start.plusMonths(5), "VALE3", "40", "68.30", "5.50", "Diversificação em mineração"),
                income(start.plusMonths(6), "ITUB4", "JCP", "42.50", "Juros sobre capital próprio"),
                buy(start.plusMonths(8), "HGLG11", "12", "164.20", "3.90", "Entrada no segmento logístico"),
                income(start.plusMonths(9), "PETR4", "DIVIDENDO", "95.00", "Distribuição de dividendos"),
                buy(start.plusMonths(11), "WEGE3", "30", "29.80", "3.20", "Exposição ao setor industrial"),

                buy(start.plusYears(1).plusMonths(1), "KNRI11", "10", "139.40", "3.50", "Diversificação de FIIs"),
                buy(start.plusYears(1).plusMonths(3), "ITUB4", "50", "25.90", "4.30", "Reforço de posição"),
                sell(start.plusYears(1).plusMonths(5), "PETR4", "25", "31.80", "4.10", "Rebalanceamento parcial"),
                income(start.plusYears(1).plusMonths(6), "VALE3", "JCP", "78.40", "Juros sobre capital próprio"),
                buy(start.plusYears(1).plusMonths(8), "MXRF11", "40", "10.18", "2.20", "Reinvestimento de proventos"),
                bonus(start.plusYears(1).plusMonths(10), "ITUB4", "15", "Bonificação de 10% em ações"),
                income(start.plusYears(1).plusMonths(11), "PETR4", "DIVIDENDO", "180.00", "Distribuição de dividendos"),

                buy(start.plusYears(2).plusMonths(1), "VALE3", "20", "64.70", "4.60", "Aporte programado"),
                split(start.plusYears(2).plusMonths(3), "WEGE3", "60", "1:2", "Desdobramento de ações"),
                buy(start.plusYears(2).plusMonths(4), "HGLG11", "8", "158.60", "3.60", "Aumento da posição logística"),
                income(start.plusYears(2).plusMonths(5), "ITUB4", "JCP", "96.20", "Juros sobre capital próprio"),
                subscription(start.plusYears(2).plusMonths(6), "MXRF11", "20", "9.72", "1.90", "Exercício de subscrição"),
                sell(start.plusYears(2).plusMonths(8), "VALE3", "15", "72.10", "4.40", "Realização parcial de lucro"),
                income(start.plusYears(2).plusMonths(9), "PETR4", "DIVIDENDO", "146.25", "Distribuição de dividendos"),
                buy(start.plusYears(2).plusMonths(10), "PETR4", "50", "35.20", "5.10", "Novo aporte em energia"),

                buy(start.plusYears(3).plusMonths(1), "WEGE3", "20", "36.40", "3.30", "Aporte no setor industrial"),
                sell(start.plusYears(3).plusMonths(3), "ITUB4", "40", "31.90", "4.50", "Rebalanceamento de ações"),
                buy(start.plusYears(3).plusMonths(5), "KNRI11", "6", "151.80", "3.10", "Reforço no fundo híbrido"),
                income(start.plusYears(3).plusMonths(6), "VALE3", "DIVIDENDO", "118.80", "Distribuição de dividendos"),
                bonus(start.plusYears(3).plusMonths(7), "PETR4", "12.5", "Bonificação de ações"),
                income(start.plusYears(3).plusMonths(8), "ITUB4", "JCP", "86.25", "Juros sobre capital próprio"),
                buy(start.plusYears(3).plusMonths(9), "MXRF11", "60", "10.32", "2.50", "Reinvestimento de rendimentos"),
                income(start.plusYears(3).plusMonths(10), "PETR4", "DIVIDENDO", "206.25", "Distribuição de dividendos"),
                sell(start.plusYears(3).plusMonths(11), "WEGE3", "10", "41.70", "3.40", "Ajuste de alocação"),

                buy(start.plusYears(4).plusMonths(2), "ITUB4", "35", "34.80", "4.20", "Aporte recorrente"),
                buy(start.plusYears(4).plusMonths(4), "VALE3", "25", "55.90", "4.80", "Preço médio e diversificação"),
                income(start.plusYears(4).plusMonths(5), "PETR4", "DIVIDENDO", "220.00", "Distribuição de dividendos"),
                reverseSplit(start.plusYears(4).plusMonths(6), "MXRF11", "100", "2:1", "Grupamento demonstrativo de cotas"),
                buy(start.plusYears(4).plusMonths(8), "HGLG11", "5", "154.30", "3.00", "Reforço no fundo logístico"),
                income(start.plusYears(4).plusMonths(9), "ITUB4", "JCP", "102.40", "Juros sobre capital próprio"),
                sell(start.plusYears(4).plusMonths(10), "PETR4", "30", "38.60", "4.70", "Realização parcial de lucro"),

                buy(today.minusMonths(5), "PETR4", "25", "36.10", "4.00", "Aporte recente"),
                income(today.minusMonths(4), "VALE3", "JCP", "97.50", "Juros sobre capital próprio"),
                buy(today.minusMonths(3), "WEGE3", "15", "45.20", "3.20", "Aporte recente no setor industrial"),
                income(today, "ITUB4", "JCP", "115.60", "Crédito mais recente")
        );

        records.saveAllAndFlush(history.stream()
                .map(seed -> seed.toEntity(wallet, requiredAsset(catalog, seed.ticker())))
                .toList());
        reconcileMonthlyFiiDividends(wallet, catalog, today);
    }

    private void reconcileMonthlyFiiDividends(Wallet wallet, Map<String, Asset> catalog, LocalDate today) {
        Map<String, BigDecimal> rates = Map.of(
                "MXRF11", bd("0.10"),
                "HGLG11", bd("1.10"),
                "KNRI11", bd("1.00"));
        List<LedgerRecord> history = records.findByWalletIdOrderByDateAscCreatedAtAsc(wallet.getId());
        List<LedgerRecord> additions = new ArrayList<>();

        rates.forEach((ticker, baseRate) -> {
            Asset asset = requiredAsset(catalog, ticker);
            LocalDate acquisition = history.stream()
                    .filter(item -> item.getAsset().getTicker().equals(ticker))
                    .filter(item -> item.getType() == LedgerRecord.Type.COMPRA
                            || item.getType() == LedgerRecord.Type.SUBSCRICAO)
                    .map(LedgerRecord::getDate)
                    .min(LocalDate::compareTo)
                    .orElse(null);
            if (acquisition == null) return;

            Set<YearMonth> paidMonths = history.stream()
                    .filter(item -> item.getAsset().getTicker().equals(ticker))
                    .filter(item -> item.getType() == LedgerRecord.Type.DIVIDENDO)
                    .map(item -> YearMonth.from(item.getDate()))
                    .collect(java.util.stream.Collectors.toSet());

            for (YearMonth month = YearMonth.from(acquisition).plusMonths(1);
                 !month.isAfter(YearMonth.from(today)); month = month.plusMonths(1)) {
                if (paidMonths.contains(month)) continue;
                LocalDate paymentDate = month.atDay(Math.min(15, month.lengthOfMonth()));
                if (paymentDate.isAfter(today)) paymentDate = today;
                BigDecimal quantity = fiiQuantityAt(history, ticker, paymentDate);
                if (quantity.signum() <= 0) continue;
                BigDecimal variation = switch (month.getMonthValue() % 3) {
                    case 0 -> bd("1.05");
                    case 1 -> bd("0.95");
                    default -> BigDecimal.ONE;
                };
                BigDecimal total = quantity.multiply(baseRate).multiply(variation)
                        .setScale(2, RoundingMode.HALF_UP);
                additions.add(income(paymentDate, ticker, "DIVIDENDO", total.toPlainString(),
                        "Rendimento mensal do FII").toEntity(wallet, asset));
            }
        });
        records.saveAll(additions);
    }

    private BigDecimal fiiQuantityAt(List<LedgerRecord> history, String ticker, LocalDate date) {
        BigDecimal quantity = BigDecimal.ZERO;
        for (LedgerRecord item : history.stream()
                .filter(record -> record.getAsset().getTicker().equals(ticker))
                .filter(record -> !record.getDate().isAfter(date))
                .sorted(Comparator.comparing(LedgerRecord::getDate)
                        .thenComparing(record -> record.getId().toString()))
                .toList()) {
            quantity = switch (item.getType()) {
                case COMPRA, SUBSCRICAO, BONIFICACAO -> quantity.add(item.getQuantity());
                case VENDA -> quantity.subtract(item.getQuantity());
                case DESDOBRAMENTO, GRUPAMENTO -> item.getNewQuantity();
                case DIVIDENDO, JCP -> quantity;
            };
        }
        return quantity;
    }

    private Asset requiredAsset(Map<String, Asset> catalog, String ticker) {
        Asset asset = catalog.get(ticker);
        if (asset == null) throw new IllegalStateException("Ativo obrigatório ausente no catálogo: " + ticker);
        return asset;
    }

    private static SeedRecord buy(LocalDate date, String ticker, String quantity, String unitPrice,
                                  String fees, String description) {
        return operation(date, ticker, LedgerRecord.Type.COMPRA, quantity, unitPrice, fees, description);
    }

    private static SeedRecord subscription(LocalDate date, String ticker, String quantity, String unitPrice,
                                           String fees, String description) {
        return operation(date, ticker, LedgerRecord.Type.SUBSCRICAO, quantity, unitPrice, fees, description);
    }

    private static SeedRecord sell(LocalDate date, String ticker, String quantity, String unitPrice,
                                   String fees, String description) {
        BigDecimal gross = bd(quantity).multiply(bd(unitPrice));
        return new SeedRecord(date, ticker, LedgerRecord.Type.VENDA, bd(quantity), bd(unitPrice), bd(fees),
                gross.subtract(bd(fees)), null, null, description);
    }

    private static SeedRecord operation(LocalDate date, String ticker, LedgerRecord.Type type, String quantity,
                                        String unitPrice, String fees, String description) {
        BigDecimal total = bd(quantity).multiply(bd(unitPrice)).add(bd(fees));
        return new SeedRecord(date, ticker, type, bd(quantity), bd(unitPrice), bd(fees), total,
                null, null, description);
    }

    private static SeedRecord income(LocalDate date, String ticker, String type, String total, String description) {
        return new SeedRecord(date, ticker, LedgerRecord.Type.valueOf(type), null, null, null, bd(total),
                null, null, description);
    }

    private static SeedRecord bonus(LocalDate date, String ticker, String quantity, String description) {
        return new SeedRecord(date, ticker, LedgerRecord.Type.BONIFICACAO, bd(quantity), null, null, null,
                null, null, description);
    }

    private static SeedRecord split(LocalDate date, String ticker, String newQuantity, String ratio, String description) {
        return corporateEvent(date, ticker, LedgerRecord.Type.DESDOBRAMENTO, newQuantity, ratio, description);
    }

    private static SeedRecord reverseSplit(LocalDate date, String ticker, String newQuantity, String ratio,
                                           String description) {
        return corporateEvent(date, ticker, LedgerRecord.Type.GRUPAMENTO, newQuantity, ratio, description);
    }

    private static SeedRecord corporateEvent(LocalDate date, String ticker, LedgerRecord.Type type,
                                             String newQuantity, String ratio, String description) {
        return new SeedRecord(date, ticker, type, null, null, null, null, bd(newQuantity), ratio, description);
    }

    private static BigDecimal bd(String value) { return new BigDecimal(value); }

    private record SeedRecord(LocalDate date, String ticker, LedgerRecord.Type type, BigDecimal quantity,
                              BigDecimal unitPrice, BigDecimal fees, BigDecimal totalValue,
                              BigDecimal newQuantity, String ratio, String description) {
        LedgerRecord toEntity(Wallet wallet, Asset asset) {
            LedgerRecord record = new LedgerRecord(wallet, asset);
            record.update(type, date, quantity, unitPrice, fees, totalValue, newQuantity, ratio, description);
            return record;
        }
    }
}
