package br.com.mad.web;

import br.com.mad.domain.User;
import br.com.mad.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final UserRepository users;
    public ProfileController(UserRepository users) { this.users = users; }
    public record ProfileRequest(@NotBlank @Size(max = 120) String name, @NotBlank @Email String email) {}

    @PutMapping
    @Transactional
    public Map<String, Object> update(@Valid @RequestBody ProfileRequest body, Authentication auth) {
        User user = owned(auth);
        String email = body.email().trim().toLowerCase();
        users.findByEmailIgnoreCase(email).filter(other -> !other.getId().equals(user.getId()))
                .ifPresent(other -> { throw new ApiException(HttpStatus.CONFLICT, "E-mail já cadastrado."); });
        user.setName(body.name().trim());
        user.setEmail(email);
        return Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail());
    }
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@RequestParam(defaultValue = "false") boolean confirm, Authentication auth) {
        if (!confirm) throw new ApiException(HttpStatus.CONFLICT, "Confirme a exclusão definitiva com ?confirm=true.");
        users.delete(owned(auth));
    }
    private User owned(Authentication auth) {
        return users.findById((UUID) auth.getPrincipal())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
