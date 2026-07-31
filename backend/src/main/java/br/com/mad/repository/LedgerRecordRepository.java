package br.com.mad.repository;

import br.com.mad.domain.LedgerRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LedgerRecordRepository extends JpaRepository<LedgerRecord, UUID> {
    List<LedgerRecord> findByWalletIdOrderByDateAscCreatedAtAsc(UUID walletId);
    List<LedgerRecord> findByWalletIdAndAssetIdOrderByDateAscCreatedAtAsc(UUID walletId, UUID assetId);
    Optional<LedgerRecord> findByIdAndWalletUserId(UUID id, UUID userId);
    boolean existsByWalletId(UUID walletId);
}

