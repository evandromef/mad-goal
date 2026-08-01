package br.com.mad;

import br.com.mad.domain.LedgerRecord;
import br.com.mad.domain.User;
import br.com.mad.domain.Wallet;
import br.com.mad.config.DemoDataInitializer;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.repository.UserRepository;
import br.com.mad.repository.WalletRepository;
import br.com.mad.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "app.demo-data.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:mad-demo;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"
})
@ActiveProfiles("dev")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class DemoDataInitializerIntegrationTest {
    @Autowired UserRepository users;
    @Autowired WalletRepository wallets;
    @Autowired LedgerRecordRepository records;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired PortfolioService portfolio;
    @Autowired DemoDataInitializer initializer;

    @Test
    void criaPerfilCompletoComCincoAnosDeHistorico() {
        User user = users.findByEmailIgnoreCase("demonstracao@mad.local").orElseThrow();
        assertThat(user.getName()).isEqualTo("Marina Oliveira");
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(passwordEncoder.matches("Mad@12345", user.getPasswordHash())).isTrue();

        List<Wallet> userWallets = wallets.findByUserIdOrderByName(user.getId());
        assertThat(userWallets).extracting(Wallet::getName).containsExactly("Carteira de longo prazo");
        Wallet wallet = userWallets.getFirst();
        List<LedgerRecord> history = records.findByWalletIdOrderByDateAscCreatedAtAsc(wallet.getId());

        assertThat(history).hasSizeGreaterThan(190);
        assertThat(history.stream().map(item -> item.getAsset().getTicker()).distinct())
                .containsExactlyInAnyOrder("PETR4", "VALE3", "ITUB4", "WEGE3", "MXRF11", "HGLG11", "KNRI11");
        assertThat(history).extracting(LedgerRecord::getType)
                .containsAll(EnumSet.allOf(LedgerRecord.Type.class));
        assertThat(history.getFirst().getDate()).isEqualTo(LocalDate.now().minusYears(5));
        assertThat(history.getLast().getDate()).isEqualTo(LocalDate.now());
        assertThat(portfolio.positions(wallet.getId())).hasSize(7);
        assertMonthlyFiiDividends(history, "MXRF11");
        assertMonthlyFiiDividends(history, "HGLG11");
        assertMonthlyFiiDividends(history, "KNRI11");

        int recordCount = history.size();
        initializer.run(null);
        assertThat(users.findByEmailIgnoreCase("demonstracao@mad.local").orElseThrow().getId()).isEqualTo(user.getId());
        assertThat(records.findByWalletIdOrderByDateAscCreatedAtAsc(wallet.getId())).hasSize(recordCount);
    }

    private void assertMonthlyFiiDividends(List<LedgerRecord> history, String ticker) {
        YearMonth acquisitionMonth = history.stream()
                .filter(item -> item.getAsset().getTicker().equals(ticker))
                .filter(item -> item.getType() == LedgerRecord.Type.COMPRA
                        || item.getType() == LedgerRecord.Type.SUBSCRICAO)
                .map(item -> YearMonth.from(item.getDate()))
                .min(YearMonth::compareTo)
                .orElseThrow();
        List<YearMonth> expected = new ArrayList<>();
        for (YearMonth month = acquisitionMonth.plusMonths(1);
             !month.isAfter(YearMonth.now()); month = month.plusMonths(1)) {
            expected.add(month);
        }
        assertThat(history.stream()
                .filter(item -> item.getAsset().getTicker().equals(ticker))
                .filter(item -> item.getType() == LedgerRecord.Type.DIVIDENDO)
                .map(item -> YearMonth.from(item.getDate())))
                .containsExactlyElementsOf(expected);
    }
}
