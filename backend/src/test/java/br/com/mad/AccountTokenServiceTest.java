package br.com.mad;

import br.com.mad.domain.AccountToken;
import br.com.mad.domain.User;
import br.com.mad.repository.AccountTokenRepository;
import br.com.mad.repository.RefreshTokenRepository;
import br.com.mad.service.AccountTokenService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AccountTokenServiceTest {
    @Test
    void limitaRecuperacaoDeSenhaATrintaMinutos() {
        AccountTokenRepository accountTokens = mock(AccountTokenRepository.class);
        AccountTokenService service = new AccountTokenService(accountTokens, mock(RefreshTokenRepository.class));
        User user = new User("Ana", "ana@example.com", "hash");
        ArgumentCaptor<AccountToken> captor = ArgumentCaptor.forClass(AccountToken.class);
        service.issueAccountToken(user, AccountToken.Type.PASSWORD_RESET);
        Instant after = Instant.now();

        verify(accountTokens).save(captor.capture());
        Duration validity = Duration.between(after, captor.getValue().getExpiresAt());
        assertThat(validity).isBetween(Duration.ofMinutes(29).plusSeconds(59), Duration.ofMinutes(30));
    }
}
