package br.com.mad.repository;

import br.com.mad.domain.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;

public interface AssetRepository extends JpaRepository<Asset, UUID> {
    List<Asset> findByActiveTrueOrderByTicker();
    Optional<Asset> findByTickerIgnoreCase(String ticker);
    @Query("select distinct record.asset from LedgerRecord record")
    List<Asset> findReferencedAssets();
}
