package br.com.mad.web;

import br.com.mad.domain.User;
import br.com.mad.repository.UserRepository;
import br.com.mad.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    public record Credentials(@NotBlank @Email String email, @NotBlank @Size(min = 8, max = 72) String password) {}
    public record Registration(@NotBlank @Size(max = 120) String name,
                               @NotBlank @Email String email,
                               @NotBlank @Size(min = 8, max = 72) String password) {}
    public record AuthResponse(String token, UUID id, String name, String email) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AuthResponse register(@Valid @RequestBody Registration body) {
        String email = body.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        User user = users.save(new User(body.name().trim(), email, encoder.encode(body.password())));
        return response(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody Credentials body) {
        User user = users.findByEmailIgnoreCase(body.email().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));
        if (!encoder.matches(body.password(), user.getPasswordHash()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        return response(user);
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        User user = users.findById((UUID) authentication.getPrincipal())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        return Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail());
    }

    private AuthResponse response(User user) {
        return new AuthResponse(jwt.create(user), user.getId(), user.getName(), user.getEmail());
    }
}
