package br.com.mad.service;

import br.com.mad.domain.Asset;
import br.com.mad.domain.LedgerRecord;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class PortfolioService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final MathContext MC = MathContext.DECIMAL128;
    private final LedgerRecordRepository records;

    public PortfolioService(LedgerRecordRepository records) { this.records = records; }

    public record Position(Asset asset, BigDecimal quantity, BigDecimal acquisitionCost) {
        public BigDecimal currentValue() {
            return asset.getCurrentPrice() == null ? ZERO : quantity.multiply(asset.getCurrentPrice(), MC);
        }
        public BigDecimal profitLoss() { return currentValue().subtract(acquisitionCost, MC); }
        public BigDecimal returnPercentage() {
            return acquisitionCost.signum() == 0 ? null
                    : profitLoss().divide(acquisitionCost, MC).multiply(BigDecimal.valueOf(100), MC);
        }
    }

    private static final class MutablePosition {
        Asset asset;
        BigDecimal quantity = ZERO;
        BigDecimal cost = ZERO;
    }

    public Map<UUID, Position> positions(UUID walletId) {
        return calculate(records.findByWalletIdOrderByDateAscCreatedAtAsc(walletId), null);
    }

    public Map<UUID, Position> positionsAt(UUID walletId, LocalDate date) {
        return calculate(records.findByWalletIdOrderByDateAscCreatedAtAsc(walletId), date);
    }

    public void validate(UUID walletId) {
        calculate(records.findByWalletIdOrderByDateAscCreatedAtAsc(walletId), null);
    }

    private Map<UUID, Position> calculate(List<LedgerRecord> ledger, LocalDate cutoff) {
        Map<UUID, MutablePosition> state = new LinkedHashMap<>();
        ledger.stream()
                .filter(item -> cutoff == null || !item.getDate().isAfter(cutoff))
                .sorted(Comparator.comparing(LedgerRecord::getDate)
                        .thenComparing(LedgerRecord::getCreatedAt)
                        .thenComparing(item -> item.getId().toString()))
                .forEach(item -> apply(state.computeIfAbsent(item.getAsset().getId(), ignored -> {
                    MutablePosition position = new MutablePosition();
                    position.asset = item.getAsset();
                    return position;
                }), item));
        Map<UUID, Position> result = new LinkedHashMap<>();
        state.forEach((id, value) -> {
            if (value.quantity.signum() != 0 || value.cost.signum() != 0)
                result.put(id, new Position(value.asset, value.quantity, value.cost));
        });
        return result;
    }

    private void apply(MutablePosition position, LedgerRecord item) {
        switch (item.getType()) {
            case COMPRA, SUBSCRICAO -> {
                position.quantity = position.quantity.add(item.getQuantity(), MC);
                position.cost = position.cost.add(item.getTotalValue(), MC);
            }
            case VENDA -> {
                if (item.getQuantity().compareTo(position.quantity) > 0)
                    throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                            "Venda superior à posição disponível em " + item.getDate() + ".");
                if (position.quantity.signum() == 0)
                    throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Não há posição disponível para venda.");
                BigDecimal reduction = position.cost.multiply(item.getQuantity(), MC)
                        .divide(position.quantity, MC);
                position.cost = position.cost.subtract(reduction, MC);
                position.quantity = position.quantity.subtract(item.getQuantity(), MC);
                if (position.quantity.signum() == 0) position.cost = ZERO;
            }
            case BONIFICACAO -> position.quantity = position.quantity.add(item.getQuantity(), MC);
            case DESDOBRAMENTO, GRUPAMENTO -> position.quantity = item.getNewQuantity();
            case DIVIDENDO, JCP -> { }
        }
    }

    public List<Map<String, Object>> evolution(UUID walletId, String granularity) {
        List<LedgerRecord> ledger = records.findByWalletIdOrderByDateAscCreatedAtAsc(walletId);
        if (ledger.isEmpty()) return List.of();
        YearMonth first = YearMonth.from(ledger.getFirst().getDate());
        YearMonth last = YearMonth.from(ledger.getLast().getDate());
        List<Map<String, Object>> monthly = new ArrayList<>();
        for (YearMonth month = first; !month.isAfter(last); month = month.plusMonths(1)) {
            BigDecimal total = positionsAt(walletId, month.atEndOfMonth()).values().stream()
                    .map(Position::acquisitionCost).reduce(ZERO, BigDecimal::add);
            monthly.add(Map.of("period", month.toString(), "acquisitionCost", money(total)));
        }
        if (!"ANUAL".equalsIgnoreCase(granularity)) return monthly;
        Map<String, Map<String, Object>> years = new LinkedHashMap<>();
        monthly.forEach(point -> years.put(point.get("period").toString().substring(0, 4),
                Map.of("period", point.get("period").toString().substring(0, 4),
                        "acquisitionCost", point.get("acquisitionCost"))));
        return new ArrayList<>(years.values());
    }

    public static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
