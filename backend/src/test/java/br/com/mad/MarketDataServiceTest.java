package br.com.mad;

import br.com.mad.domain.Asset;
import br.com.mad.repository.AssetRepository;
import br.com.mad.service.MarketDataService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class MarketDataServiceTest {
    @Test
    void sincronizaCatalogoElegivel() {
        AssetRepository repository = mock(AssetRepository.class);
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        when(repository.findByTickerIgnoreCase(any())).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        Asset removed = new Asset("OLD3", "Removido", Asset.Category.ACAO, null);
        when(repository.findAll()).thenReturn(List.of(removed));
        server.expect(requestTo("https://brapi.test/api/quote/list?limit=1000")).andRespond(withSuccess("""
                {"stocks":[
                  {"stock":"ABCD3","name":"Empresa","type":"stock","subType":"stock","close":12.34567891},
                  {"stock":"FUND11","name":"Fundo","type":"fund","subType":"fii","close":99.1},
                  {"stock":"OFF3","name":"Indisponível","type":"stock","subType":"stock","active":false},
                  {"stock":"IGNO3","name":"Ignorado","type":"index","subType":"index","close":1}
                ]}
                """, MediaType.APPLICATION_JSON));
        MarketDataService service = new MarketDataService(repository, builder, "https://brapi.test", "", true);

        assertThat(service.synchronizeCatalog()).isEqualTo(2);
        verify(repository, times(2)).save(any(Asset.class));
        assertThat(removed.isActive()).isFalse();
        server.verify();
    }

    @Test
    void atualizaSomenteAtivoReferenciadoEMantemCotacaoEmFalha() {
        AssetRepository repository = mock(AssetRepository.class);
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        Asset asset = new Asset("ABCD3", "Empresa", Asset.Category.ACAO, new BigDecimal("10"));
        when(repository.findReferencedAssets()).thenReturn(List.of(asset));
        when(repository.save(asset)).thenReturn(asset);
        server.expect(requestTo("https://brapi.test/api/v2/stocks/quote?symbols=ABCD3")).andRespond(withSuccess("""
                {"results":[{"data":{"regularMarketPrice":15.12345678,"regularMarketTime":"2026-07-30T20:00:00Z"}}]}
                """, MediaType.APPLICATION_JSON));
        MarketDataService service = new MarketDataService(repository, builder, "https://brapi.test", "token", true);

        assertThat(service.updateReferencedQuotes()).isEqualTo(1);
        assertThat(asset.getCurrentPrice()).isEqualByComparingTo("15.12345678");
        verify(repository).save(asset);
        server.verify();
    }

    @Test
    void ficaInerteQuandoDesabilitado() {
        AssetRepository repository = mock(AssetRepository.class);
        MarketDataService service = new MarketDataService(repository, RestClient.builder(),
                "https://brapi.test", "", false);
        assertThat(service.synchronizeCatalog()).isZero();
        assertThat(service.updateReferencedQuotes()).isZero();
        verifyNoInteractions(repository);
    }
}
