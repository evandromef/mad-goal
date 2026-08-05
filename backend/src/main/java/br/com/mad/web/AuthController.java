package br.com.mad.web;

import br.com.mad.domain.AccountToken;
import br.com.mad.domain.User;
import br.com.mad.repository.UserRepository;
import br.com.mad.security.JwtService;
import br.com.mad.service.AccountTokenService;
import br.com.mad.service.AccountMailService;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AccountTokenService tokens;
    private final AccountMailService mail;
    private final RestClient google;
    private final String googleClientId;
    private final boolean exposeTokens;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt,
                          AccountTokenService tokens, AccountMailService mail, RestClient.Builder restClientBuilder,
                          @Value("${app.google.client-id:}") String googleClientId,
                          @Value("${app.account.expose-tokens:false}") boolean exposeTokens) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.tokens = tokens;
        this.mail = mail;
        this.google = restClientBuilder.baseUrl("https://oauth2.googleapis.com").build();
        this.googleClientId = googleClientId;
        this.exposeTokens = exposeTokens;
    }

    public record Credentials(@NotBlank @Email String email,
                              @NotBlank @Size(min = 8, max = 72) String password) {}
    public record Registration(@NotBlank @Size(max = 120) String name,
                               @NotBlank @Email String email,
                               @NotBlank @Size(min = 8, max = 72) String password) {}
    public record TokenRequest(@NotBlank String token) {}
    public record GoogleRequest(@NotBlank String credential) {}
    public record ResetRequest(@NotBlank String token,
                               @NotBlank @Size(min = 8, max = 72) String password) {}
    public record EmailRequest(@NotBlank @Email String email) {}
    public record AuthResponse(String token, String refreshToken, UUID id, String name, String email) {}
    public record PendingResponse(String message, String verificationToken) {}
    private record GoogleClaims(String sub, String aud, String email, String name,
                                @JsonProperty("email_verified") String emailVerified) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PendingResponse register(@Valid @RequestBody Registration body) {
        String email = body.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }
        User user = users.save(new User(body.name().trim(), email, encoder.encode(body.password())));
        String token = tokens.issueAccountToken(user, AccountToken.Type.EMAIL_CONFIRMATION);
        if (!exposeTokens) mail.sendConfirmation(user, token);
        return new PendingResponse("Cadastro criado. Confirme seu e-mail para entrar.", exposeTokens ? token : null);
    }

    @PostMapping("/confirm-email")
    @Transactional
    public AuthResponse confirmEmail(@Valid @RequestBody TokenRequest body) {
        User user = tokens.consumeAccountToken(body.token(), AccountToken.Type.EMAIL_CONFIRMATION);
        user.verifyEmail();
        return response(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody Credentials body) {
        User user = users.findByEmailIgnoreCase(body.email().trim())
                .orElseThrow(() -> invalidCredentials());
        if (!encoder.matches(body.password(), user.getPasswordHash())) throw invalidCredentials();
        if (!user.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Confirme seu e-mail antes de entrar.");
        }
        return response(user);
    }

    @PostMapping("/google")
    @Transactional
    public AuthResponse google(@Valid @RequestBody GoogleRequest body) {
        if (googleClientId.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Login com Google não configurado.");
        }
        GoogleClaims claims;
        try {
            claims = google.get().uri(uri -> uri.path("/tokeninfo")
                            .queryParam("id_token", body.credential()).build())
                    .retrieve().body(GoogleClaims.class);
        } catch (RuntimeException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credencial Google inválida.");
        }
        if (claims == null || !googleClientId.equals(claims.aud())
                || !"true".equalsIgnoreCase(claims.emailVerified())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credencial Google inválida.");
        }
        String email = claims.email().trim().toLowerCase();
        User user = users.findByGoogleSubject(claims.sub())
                .or(() -> users.findByEmailIgnoreCase(email))
                .orElseGet(() -> new User(claims.name(), email, encoder.encode(UUID.randomUUID().toString())));
        user.linkGoogle(claims.sub());
        users.save(user);
        return response(user);
    }

    @PostMapping("/forgot-password")
    @Transactional
    public PendingResponse forgotPassword(@Valid @RequestBody EmailRequest body) {
        String token = users.findByEmailIgnoreCase(body.email().trim())
                .map(user -> {
                    String issued = tokens.issueAccountToken(user, AccountToken.Type.PASSWORD_RESET);
                    if (!exposeTokens) mail.sendPasswordReset(user, issued);
                    return issued;
                })
                .orElse(null);
        return new PendingResponse("Se o e-mail estiver cadastrado, as instruções foram geradas.",
                exposeTokens ? token : null);
    }

    @PostMapping("/reset-password")
    @Transactional
    public Map<String, String> resetPassword(@Valid @RequestBody ResetRequest body) {
        User user = tokens.consumeAccountToken(body.token(), AccountToken.Type.PASSWORD_RESET);
        user.setPasswordHash(encoder.encode(body.password()));
        user.verifyEmail();
        tokens.revokeAllRefreshTokens(user);
        return Map.of("message", "Senha redefinida com sucesso.");
    }

    @PostMapping("/refresh")
    @Transactional
    public AuthResponse refresh(@Valid @RequestBody TokenRequest body) {
        return response(tokens.rotateRefreshToken(body.token()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void logout(@Valid @RequestBody TokenRequest body) {
        tokens.revokeRefreshToken(body.token());
    }

    @GetMapping("/config")
    public Map<String, String> config() {
        return Map.of("googleClientId", googleClientId);
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        User user = users.findById((UUID) authentication.getPrincipal())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        return Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail());
    }

    private AuthResponse response(User user) {
        return new AuthResponse(jwt.create(user), tokens.issueRefreshToken(user),
                user.getId(), user.getName(), user.getEmail());
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
    }
}
