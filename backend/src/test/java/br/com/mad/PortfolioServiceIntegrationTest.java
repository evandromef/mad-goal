package br.com.mad;

import br.com.mad.domain.*;
import br.com.mad.repository.*;
import br.com.mad.service.PortfolioService;
import br.com.mad.web.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class PortfolioServiceIntegrationTest {
    @Autowired UserRepository users;
    @Autowired WalletRepository wallets;
    @Autowired AssetRepository assets;
    @Autowired LedgerRecordRepository records;
    @Autowired PortfolioService portfolio;

    @Test
    void vendaReduzQuantidadeECustoProporcionalmente() {
        User user = users.save(new User("Bia", "bia@example.com", "hash"));
        Wallet wallet = wallets.save(new Wallet(user, "Principal"));
        Asset asset = assets.findByActiveTrueOrderByTicker().getFirst();
        save(wallet, asset, LedgerRecord.Type.COMPRA, "2026-01-10", "10", "1000");
        save(wallet, asset, LedgerRecord.Type.VENDA, "2026-02-10", "4", "500");

        PortfolioService.Position position = portfolio.positions(wallet.getId()).get(asset.getId());
        assertThat(position.quantity()).isEqualByComparingTo("6");
        assertThat(position.acquisitionCost()).isEqualByComparingTo("600");
    }

    @Test
    void impedeVendaRetroativaSuperiorAPosicao() {
        User user = users.save(new User("Caio", "caio@example.com", "hash"));
        Wallet wallet = wallets.save(new Wallet(user, "Principal"));
        Asset asset = assets.findByActiveTrueOrderByTicker().getFirst();
        save(wallet, asset, LedgerRecord.Type.COMPRA, "2026-02-10", "10", "1000");
        save(wallet, asset, LedgerRecord.Type.VENDA, "2026-01-10", "1", "100");

        assertThatThrownBy(() -> portfolio.validate(wallet.getId()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Venda superior");
    }

    @Test
    void preservaCotacaoAusenteSemInventarPrejuizo() {
        User user = users.save(new User("Dani", "dani@example.com", "hash"));
        Wallet wallet = wallets.save(new Wallet(user, "Principal"));
        Asset asset = assets.save(new Asset("SEMCO", "Sem cotação", Asset.Category.ACAO, null));
        save(wallet, asset, LedgerRecord.Type.COMPRA, "2026-01-10", "0.12345678", "100.12345678");

        PortfolioService.Position position = portfolio.positions(wallet.getId()).get(asset.getId());
        assertThat(position.quantity()).isEqualByComparingTo("0.12345678");
        assertThat(position.currentValue()).isNull();
        assertThat(position.profitLoss()).isNull();
        assertThat(position.returnPercentage()).isNull();
    }

    @Test
    void aplicaBonificacaoEEventoSemAlterarCusto() {
        User user = users.save(new User("Eva", "eva@example.com", "hash"));
        Wallet wallet = wallets.save(new Wallet(user, "Principal"));
        Asset asset = assets.findByActiveTrueOrderByTicker().getFirst();
        save(wallet, asset, LedgerRecord.Type.COMPRA, "2025-01-10", "10", "1000");
        save(wallet, asset, LedgerRecord.Type.BONIFICACAO, "2025-02-10", "2", null);
        LedgerRecord split = new LedgerRecord(wallet, asset);
        split.update(LedgerRecord.Type.DESDOBRAMENTO, LocalDate.parse("2025-03-10"),
                null, null, null, null, new BigDecimal("24"), "1:2", null);
        records.saveAndFlush(split);

        PortfolioService.Position position = portfolio.positions(wallet.getId()).get(asset.getId());
        assertThat(position.quantity()).isEqualByComparingTo("24");
        assertThat(position.acquisitionCost()).isEqualByComparingTo("1000");
        assertThat(portfolio.evolution(wallet.getId(), "YEARLY")).hasSize(1);
    }

    private void save(Wallet wallet, Asset asset, LedgerRecord.Type type,
                      String date, String quantity, String total) {
        LedgerRecord item = new LedgerRecord(wallet, asset);
        item.update(type, LocalDate.parse(date), new BigDecimal(quantity), null, null,
                total == null ? null : new BigDecimal(total), null, null, null);
        records.saveAndFlush(item);
    }
}
