package br.com.mad;

import br.com.mad.domain.User;
import br.com.mad.service.AccountMailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AccountMailServiceTest {
    @Test
    void enviaLinksDeConfirmacaoERecuperacao() {
        JavaMailSender sender = mock(JavaMailSender.class);
        AccountMailService service = new AccountMailService(sender, "conta@mad.test", "https://mad.test/");
        User user = new User("Ana", "ana@example.com", "hash");
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);

        service.sendConfirmation(user, "confirm-token");
        service.sendPasswordReset(user, "reset-token");

        verify(sender, times(2)).send(captor.capture());
        assertThat(captor.getAllValues().get(0).getText()).contains("mode=confirm&token=confirm-token");
        assertThat(captor.getAllValues().get(1).getText()).contains("mode=reset&token=reset-token", "30 minutos");
    }
}
