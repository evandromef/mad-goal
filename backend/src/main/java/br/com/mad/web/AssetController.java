package br.com.mad.web;

import br.com.mad.domain.Asset;
import br.com.mad.repository.AssetRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
public class AssetController {
    private final AssetRepository assets;
    public AssetController(AssetRepository assets) { this.assets = assets; }
    public record AssetResponse(UUID id, String ticker, String name, Asset.Category category,
                                BigDecimal currentPrice, LocalDate priceDate) {
        static AssetResponse of(Asset asset) {
            return new AssetResponse(asset.getId(), asset.getTicker(), asset.getName(),
                    asset.getCategory(), asset.getCurrentPrice(), asset.getPriceDate());
        }
    }
    @GetMapping
    public List<AssetResponse> list() {
        return assets.findByActiveTrueOrderByTicker().stream().map(AssetResponse::of).toList();
    }
}
