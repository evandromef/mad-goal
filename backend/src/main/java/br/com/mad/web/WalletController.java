package br.com.mad.web;

import br.com.mad.domain.User;
import br.com.mad.domain.Wallet;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.repository.UserRepository;
import br.com.mad.repository.WalletRepository;
import br.com.mad.service.PortfolioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallets")
public class WalletController {
    private final WalletRepository wallets;
    private final UserRepository users;
    private final LedgerRecordRepository records;
    private final PortfolioService portfolio;
    public WalletController(WalletRepository wallets, UserRepository users, LedgerRecordRepository records,
                            PortfolioService portfolio) {
        this.wallets = wallets; this.users = users; this.records = records; this.portfolio = portfolio;
    }
    public record WalletRequest(@NotBlank @Size(max = 80) String name) {}
    public record WalletResponse(UUID id, String name, BigDecimal currentValue) {}

    @GetMapping
    public List<WalletResponse> list(Authentication auth) {
        return wallets.findByUserIdOrderByName(userId(auth)).stream().map(this::response).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public WalletResponse create(@Valid @RequestBody WalletRequest body, Authentication auth) {
        UUID userId = userId(auth);
        String name = body.name().trim();
        if (wallets.existsByUserIdAndNameIgnoreCase(userId, name))
            throw new ApiException(HttpStatus.CONFLICT, "Já existe uma carteira com esse nome.");
        User user = users.getReferenceById(userId);
        return response(wallets.save(new Wallet(user, name)));
    }

    @PutMapping("/{id}")
    @Transactional
    public WalletResponse update(@PathVariable UUID id, @Valid @RequestBody WalletRequest body, Authentication auth) {
        Wallet wallet = owned(id, auth);
        String name = body.name().trim();
        if (!wallet.getName().equalsIgnoreCase(name)
                && wallets.existsByUserIdAndNameIgnoreCase(userId(auth), name))
            throw new ApiException(HttpStatus.CONFLICT, "Já existe uma carteira com esse nome.");
        wallet.setName(name);
        return response(wallet);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id,
                       @RequestParam(defaultValue = "false") boolean confirm,
                       Authentication auth) {
        Wallet wallet = owned(id, auth);
        if (records.existsByWalletId(id) && !confirm)
            throw new ApiException(HttpStatus.CONFLICT, "Confirme a exclusão em cascata com ?confirm=true.");
        wallets.delete(wallet);
    }

    Wallet owned(UUID id, Authentication auth) {
        return wallets.findByIdAndUserId(id, userId(auth))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Carteira não encontrada."));
    }
    static UUID userId(Authentication auth) { return (UUID) auth.getPrincipal(); }
    private WalletResponse response(Wallet wallet) {
        var positions = portfolio.positions(wallet.getId()).values();
        BigDecimal currentValue = positions.stream().anyMatch(position -> position.currentValue() == null)
                ? null
                : positions.stream().map(PortfolioService.Position::currentValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new WalletResponse(wallet.getId(), wallet.getName(),
                currentValue == null ? null : PortfolioService.money(currentValue));
    }
}
