package br.com.mad.web;

import br.com.mad.domain.Asset;
import br.com.mad.domain.LedgerRecord;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.repository.WalletRepository;
import br.com.mad.service.PortfolioService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private static final MathContext MC = MathContext.DECIMAL128;
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private final WalletRepository wallets;
    private final LedgerRecordRepository records;
    private final PortfolioService portfolio;

    public DashboardController(WalletRepository wallets, LedgerRecordRepository records, PortfolioService portfolio) {
        this.wallets = wallets; this.records = records; this.portfolio = portfolio;
    }

    public record PositionResponse(UUID assetId, String ticker, String name, Asset.Category category,
                                   BigDecimal quantity, BigDecimal acquisitionCost, BigDecimal currentPrice,
                                   BigDecimal currentValue, BigDecimal profitLoss, BigDecimal returnPercentage,
                                   BigDecimal allocationPercentage, Object priceDate) {}
    public record CategoryResponse(Asset.Category category, BigDecimal acquisitionCost,
                                   BigDecimal currentValue, BigDecimal allocationPercentage) {}
    public record DashboardResponse(BigDecimal acquisitionCost, BigDecimal currentValue,
                                    BigDecimal profitLoss, BigDecimal returnPercentage,
                                    BigDecimal totalIncome, String largestPosition,
                                    List<CategoryResponse> categories, List<PositionResponse> positions,
                                    List<Map<String, Object>> evolution) {}

    @GetMapping("/{walletId}")
    public DashboardResponse dashboard(@PathVariable UUID walletId,
                                       @RequestParam(defaultValue = "MENSAL") String granularity,
                                       Authentication auth) {
        wallets.findByIdAndUserId(walletId, WalletController.userId(auth))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Carteira não encontrada."));
        Collection<PortfolioService.Position> source = portfolio.positions(walletId).values();
        BigDecimal totalCost = sum(source, PortfolioService.Position::acquisitionCost);
        BigDecimal totalValue = sum(source, PortfolioService.Position::currentValue);
        BigDecimal pnl = totalValue.subtract(totalCost, MC);
        BigDecimal returnPct = totalCost.signum() == 0 ? null
                : pnl.divide(totalCost, MC).multiply(BigDecimal.valueOf(100), MC);

        List<PositionResponse> positions = source.stream()
                .map(position -> new PositionResponse(position.asset().getId(), position.asset().getTicker(),
                        position.asset().getName(), position.asset().getCategory(), position.quantity(),
                        PortfolioService.money(position.acquisitionCost()), position.asset().getCurrentPrice(),
                        PortfolioService.money(position.currentValue()), PortfolioService.money(position.profitLoss()),
                        nullableMoney(position.returnPercentage()), percentage(position.currentValue(), totalValue),
                        position.asset().getPriceDate()))
                .sorted(Comparator.comparing(PositionResponse::currentValue).reversed())
                .toList();

        List<CategoryResponse> categories = Arrays.stream(Asset.Category.values()).map(category -> {
            List<PortfolioService.Position> filtered = source.stream()
                    .filter(position -> position.asset().getCategory() == category).toList();
            BigDecimal cost = sum(filtered, PortfolioService.Position::acquisitionCost);
            BigDecimal value = sum(filtered, PortfolioService.Position::currentValue);
            return new CategoryResponse(category, PortfolioService.money(cost), PortfolioService.money(value),
                    percentage(value, totalValue));
        }).toList();

        BigDecimal income = records.findByWalletIdOrderByDateAscCreatedAtAsc(walletId).stream()
                .filter(item -> item.getType() == LedgerRecord.Type.DIVIDENDO || item.getType() == LedgerRecord.Type.JCP)
                .map(LedgerRecord::getTotalValue).filter(Objects::nonNull).reduce(ZERO, BigDecimal::add);
        String largest = positions.isEmpty() ? null : positions.getFirst().ticker();
        return new DashboardResponse(PortfolioService.money(totalCost), PortfolioService.money(totalValue),
                PortfolioService.money(pnl), nullableMoney(returnPct), PortfolioService.money(income), largest,
                categories, positions, portfolio.evolution(walletId, granularity));
    }

    private BigDecimal sum(Collection<PortfolioService.Position> positions,
                           java.util.function.Function<PortfolioService.Position, BigDecimal> mapper) {
        return positions.stream().map(mapper).reduce(ZERO, BigDecimal::add);
    }
    private BigDecimal percentage(BigDecimal value, BigDecimal total) {
        return total.signum() == 0 ? ZERO.setScale(2) : PortfolioService.money(
                value.divide(total, MC).multiply(BigDecimal.valueOf(100), MC));
    }
    private BigDecimal nullableMoney(BigDecimal value) {
        return value == null ? null : PortfolioService.money(value);
    }
}

