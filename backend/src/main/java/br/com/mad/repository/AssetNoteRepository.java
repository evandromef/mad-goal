package br.com.mad.repository;

import br.com.mad.domain.AssetNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetNoteRepository extends JpaRepository<AssetNote, UUID> {
    List<AssetNote> findByWalletIdAndAssetIdOrderByCreatedAtDesc(UUID walletId, UUID assetId);
    Optional<AssetNote> findByIdAndWalletUserId(UUID id, UUID userId);
}

