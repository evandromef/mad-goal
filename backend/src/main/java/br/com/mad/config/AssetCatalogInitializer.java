package br.com.mad.config;

import br.com.mad.domain.Asset;
import br.com.mad.repository.AssetRepository;
import br.com.mad.service.MarketDataService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class AssetCatalogInitializer implements ApplicationRunner {
    private final AssetRepository assets;
    private final MarketDataService marketData;
    public AssetCatalogInitializer(AssetRepository assets, MarketDataService marketData) {
        this.assets = assets; this.marketData = marketData;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (assets.count() == 0) {
            assets.saveAll(List.of(
                    new Asset("PETR4", "Petrobras PN", Asset.Category.ACAO, null),
                    new Asset("VALE3", "Vale ON", Asset.Category.ACAO, null),
                    new Asset("ITUB4", "Itaú Unibanco PN", Asset.Category.ACAO, null),
                    new Asset("WEGE3", "WEG ON", Asset.Category.ACAO, null),
                    new Asset("MXRF11", "Maxi Renda FII", Asset.Category.FII, null),
                    new Asset("HGLG11", "CSHG Logística FII", Asset.Category.FII, null),
                    new Asset("KNRI11", "Kinea Renda Imobiliária FII", Asset.Category.FII, null)
            ));
        }
        marketData.synchronizeCatalogSafely();
    }
}
