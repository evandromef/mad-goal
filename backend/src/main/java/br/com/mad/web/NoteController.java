package br.com.mad.web;

import br.com.mad.domain.Asset;
import br.com.mad.domain.AssetNote;
import br.com.mad.domain.Wallet;
import br.com.mad.repository.AssetNoteRepository;
import br.com.mad.repository.AssetRepository;
import br.com.mad.repository.WalletRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
public class NoteController {
    private final AssetNoteRepository notes;
    private final WalletRepository wallets;
    private final AssetRepository assets;
    public NoteController(AssetNoteRepository notes, WalletRepository wallets, AssetRepository assets) {
        this.notes = notes;
        this.wallets = wallets;
        this.assets = assets;
    }
    public record NoteRequest(@NotNull UUID walletId, @NotNull UUID assetId,
                              @NotBlank @Size(max = 2000) String content) {}
    public record NoteResponse(UUID id, UUID walletId, UUID assetId, String ticker, String content,
                               Instant createdAt, Instant updatedAt) {
        static NoteResponse of(AssetNote note) {
            return new NoteResponse(note.getId(), note.getWallet().getId(), note.getAsset().getId(),
                    note.getAsset().getTicker(), note.getContent(), note.getCreatedAt(), note.getUpdatedAt());
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<NoteResponse> list(@RequestParam UUID walletId, @RequestParam UUID assetId, Authentication auth) {
        ownedWallet(walletId, auth);
        return notes.findByWalletIdAndAssetIdOrderByCreatedAtDesc(walletId, assetId).stream()
                .map(NoteResponse::of).toList();
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public NoteResponse create(@Valid @RequestBody NoteRequest body, Authentication auth) {
        Wallet wallet = ownedWallet(body.walletId(), auth);
        Asset asset = assets.findById(body.assetId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Ativo não encontrado."));
        return NoteResponse.of(notes.save(new AssetNote(wallet, asset, body.content().trim())));
    }
    @PutMapping("/{id}")
    @Transactional
    public NoteResponse update(@PathVariable UUID id, @Valid @RequestBody NoteRequest body, Authentication auth) {
        AssetNote note = ownedNote(id, auth);
        if (!note.getWallet().getId().equals(body.walletId()) || !note.getAsset().getId().equals(body.assetId()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Carteira e ativo não podem ser alterados.");
        note.setContent(body.content().trim());
        return NoteResponse.of(note);
    }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id, Authentication auth) { notes.delete(ownedNote(id, auth)); }
    private Wallet ownedWallet(UUID id, Authentication auth) {
        return wallets.findByIdAndUserId(id, WalletController.userId(auth))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Carteira não encontrada."));
    }
    private AssetNote ownedNote(UUID id, Authentication auth) {
        return notes.findByIdAndWalletUserId(id, WalletController.userId(auth))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nota não encontrada."));
    }
}
