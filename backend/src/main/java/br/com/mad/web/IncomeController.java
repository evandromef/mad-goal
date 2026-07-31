package br.com.mad.web;

import br.com.mad.domain.Asset;
import br.com.mad.domain.LedgerRecord;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.repository.WalletRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.util.*;

@RestController
@RequestMapping("/api/incomes")
public class IncomeController {
    public enum GroupBy { MONTHLY, QUARTERLY, YEARLY }

    private final LedgerRecordRepository records;
    private final WalletRepository wallets;

    public IncomeController(LedgerRecordRepository records, WalletRepository wallets) {
        this.records = records;
        this.wallets = wallets;
    }

    public record IncomeItem(UUID id, UUID assetId, String ticker, Asset.Category category,
                             LedgerRecord.Type type, LocalDate date, BigDecimal totalValue) {}
    public record IncomeGroup(String period, BigDecimal total) {}
    public record IncomeResponse(BigDecimal total, List<IncomeGroup> groups, List<IncomeItem> items) {}

    @GetMapping
    @Transactional(readOnly = true)
    public IncomeResponse list(@RequestParam UUID walletId,
                               @RequestParam(required = false) UUID assetId,
                               @RequestParam(required = false) Asset.Category category,
                               @RequestParam(required = false) LedgerRecord.Type type,
                               @RequestParam(required = false) LocalDate from,
                               @RequestParam(required = false) LocalDate to,
                               @RequestParam(defaultValue = "MONTHLY") GroupBy groupBy,
                               Authentication auth) {
        wallets.findByIdAndUserId(walletId, WalletController.userId(auth))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Carteira não encontrada."));
        if (type != null && type != LedgerRecord.Type.DIVIDENDO && type != LedgerRecord.Type.JCP) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tipo de provento inválido.");
        }

        List<LedgerRecord> filtered = records.findByWalletIdOrderByDateAscCreatedAtAsc(walletId).stream()
                .filter(item -> item.getType() == LedgerRecord.Type.DIVIDENDO || item.getType() == LedgerRecord.Type.JCP)
                .filter(item -> assetId == null || item.getAsset().getId().equals(assetId))
                .filter(item -> category == null || item.getAsset().getCategory() == category)
                .filter(item -> type == null || item.getType() == type)
                .filter(item -> from == null || !item.getDate().isBefore(from))
                .filter(item -> to == null || !item.getDate().isAfter(to))
                .toList();

        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        filtered.forEach(item -> totals.merge(period(item.getDate(), groupBy), item.getTotalValue(), BigDecimal::add));
        List<IncomeItem> items = filtered.reversed().stream().map(item -> new IncomeItem(
                item.getId(), item.getAsset().getId(), item.getAsset().getTicker(),
                item.getAsset().getCategory(), item.getType(), item.getDate(), item.getTotalValue())).toList();
        BigDecimal total = filtered.stream().map(LedgerRecord::getTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new IncomeResponse(total,
                totals.entrySet().stream().map(entry -> new IncomeGroup(entry.getKey(), entry.getValue())).toList(),
                items);
    }

    private String period(LocalDate date, GroupBy groupBy) {
        return switch (groupBy) {
            case MONTHLY -> date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            case QUARTERLY -> date.getYear() + "-T" + date.get(IsoFields.QUARTER_OF_YEAR);
            case YEARLY -> Integer.toString(date.getYear());
        };
    }
}
