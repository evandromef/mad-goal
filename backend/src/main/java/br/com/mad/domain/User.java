package br.com.mad.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class User extends AuditedEntity {
    @Id
    private UUID id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, unique = true, length = 180)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;
    @Column(name = "google_subject", unique = true, length = 180)
    private String googleSubject;

    protected User() {}
    public User(String name, String email, String passwordHash) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.emailVerified = false;
    }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public boolean isEmailVerified() { return emailVerified; }
    public void verifyEmail() { this.emailVerified = true; }
    public String getGoogleSubject() { return googleSubject; }
    public void linkGoogle(String googleSubject) {
        this.googleSubject = googleSubject;
        this.emailVerified = true;
    }
}
