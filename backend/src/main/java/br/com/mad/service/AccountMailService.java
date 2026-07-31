package br.com.mad.service;

import br.com.mad.domain.User;
import br.com.mad.web.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class AccountMailService {
    private final JavaMailSender mailSender;
    private final String from;
    private final String frontendUrl;

    public AccountMailService(JavaMailSender mailSender,
                              @Value("${app.mail.from}") String from,
                              @Value("${app.mail.frontend-url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.from = from;
        this.frontendUrl = frontendUrl.replaceAll("/$", "");
    }

    public void sendConfirmation(User user, String token) {
        send(user, "Confirme seu cadastro no MAD", "Confirme seu e-mail acessando: "
                + frontendUrl + "/login?mode=confirm&token=" + token);
    }

    public void sendPasswordReset(User user, String token) {
        send(user, "Redefinição de senha do MAD", "Redefina sua senha em até 30 minutos acessando: "
                + frontendUrl + "/login?mode=reset&token=" + token);
    }

    private void send(User user, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível enviar o e-mail de conta. Tente novamente.");
        }
    }
}
