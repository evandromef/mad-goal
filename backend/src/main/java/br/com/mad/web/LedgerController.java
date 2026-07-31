package br.com.mad.web;

import br.com.mad.domain.Asset;
import br.com.mad.domain.LedgerRecord;
import br.com.mad.domain.Wallet;
import br.com.mad.repository.AssetRepository;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.repository.WalletRepository;
import br.com.mad.service.PortfolioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/records")
public class LedgerController {
    private final LedgerRecordRepository records;
    private final WalletRepository wallets;
    private final AssetRepository assets;
    private final PortfolioService portfolio;

    public LedgerController(LedgerRecordRepository records, WalletRepository wallets,
                            AssetRepository assets, PortfolioService portfolio) {
        this.records = records; this.wallets = wallets; this.assets = assets; this.portfolio = portfolio;
    }

    public record RecordRequest(@NotNull UUID walletId, @NotNull UUID assetId,
                                @NotNull LedgerRecord.Type type, @NotNull LocalDate date,
                                @Positive BigDecimal quantity, @PositiveOrZero BigDecimal unitPrice,
                                @PositiveOrZero BigDecimal fees, @Positive BigDecimal totalValue,
                                @Positive BigDecimal newQuantity, @Size(max = 30) String ratio,
                                @Size(max = 500) String description) {}
    public record RecordResponse(UUID id, UUID walletId, UUID assetId, String ticker,
                                 LedgerRecord.Type type, LocalDate date, BigDecimal quantity,
                                 BigDecimal unitPrice, BigDecimal fees, BigDecimal totalValue,
                                 BigDecimal newQuantity, String ratio, String description,
                                 Instant createdAt, Instant updatedAt) {
        static RecordResponse of(LedgerRecord item) {
            return new RecordResponse(item.getId(), item.getWallet().getId(), item.getAsset().getId(),
                    item.getAsset().getTicker(), item.getType(), item.getDate(), item.getQuantity(),
                    item.getUnitPrice(), item.getFees(), item.getTotalValue(), item.getNewQuantity(),
                    item.getRatio(), item.getDescription(), item.getCreatedAt(), item.getUpdatedAt());
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<RecordResponse> list(@RequestParam UUID walletId,
                                     @RequestParam(required = false) UUID assetId,
                                     Authentication auth) {
        ownedWallet(walletId, auth);
        List<LedgerRecord> result = assetId == null
                ? records.findByWalletIdOrderByDateAscCreatedAtAsc(walletId)
                : records.findByWalletIdAndAssetIdOrderByDateAscCreatedAtAsc(walletId, assetId);
        return result.stream().map(RecordResponse::of).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RecordResponse create(@Valid @RequestBody RecordRequest body, Authentication auth) {
        Wallet wallet = ownedWallet(body.walletId(), auth);
        Asset asset = asset(body.assetId());
        validateByType(body);
        LedgerRecord item = new LedgerRecord(wallet, asset);
        apply(item, body);
        item = records.saveAndFlush(item);
        portfolio.validate(wallet.getId());
        return RecordResponse.of(item);
    }

    @PutMapping("/{id}")
    @Transactional
    public RecordResponse update(@PathVariable UUID id, @Valid @RequestBody RecordRequest body, Authentication auth) {
        LedgerRecord item = ownedRecord(id, auth);
        if (!item.getWallet().getId().equals(body.walletId()) || !item.getAsset().getId().equals(body.assetId()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Carteira e ativo não podem ser alterados.");
        validateByType(body);
        apply(item, body);
        records.flush();
        portfolio.validate(item.getWallet().getId());
        return RecordResponse.of(item);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id, Authentication auth) {
        LedgerRecord item = ownedRecord(id, auth);
        UUID walletId = item.getWallet().getId();
        records.delete(item);
        records.flush();
        portfolio.validate(walletId);
    }

    private void validateByType(RecordRequest body) {
        switch (body.type()) {
            case COMPRA, VENDA, SUBSCRICAO -> {
                required(body.quantity(), "Quantidade é obrigatória.");
                required(body.totalValue(), "Valor total é obrigatório.");
            }
            case DIVIDENDO, JCP -> required(body.totalValue(), "Valor total é obrigatório.");
            case BONIFICACAO -> required(body.quantity(), "Quantidade é obrigatória.");
            case DESDOBRAMENTO, GRUPAMENTO -> {
                required(body.newQuantity(), "Nova quantidade é obrigatória.");
                if (body.ratio() == null || body.ratio().isBlank())
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Proporção é obrigatória.");
            }
        }
    }
    private void required(Object value, String message) {
        if (value == null) throw new ApiException(HttpStatus.BAD_REQUEST, message);
    }
    private void apply(LedgerRecord item, RecordRequest body) {
        item.update(body.type(), body.date(), body.quantity(), body.unitPrice(), body.fees(),
                body.totalValue(), body.newQuantity(), body.ratio(), body.description());
    }
    private Wallet ownedWallet(UUID id, Authentication auth) {
        return wallets.findByIdAndUserId(id, WalletController.userId(auth))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Carteira não encontrada."));
    }
    private LedgerRecord ownedRecord(UUID id, Authentication auth) {
        return records.findByIdAndWalletUserId(id, WalletController.userId(auth))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Registro não encontrado."));
    }
    private Asset asset(UUID id) {
        return assets.findById(id).filter(Asset::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Ativo não pertence ao catálogo."));
    }
}
