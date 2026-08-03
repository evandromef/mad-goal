package br.com.mad.config;

import br.com.mad.domain.Asset;
import br.com.mad.domain.User;
import br.com.mad.repository.AssetRepository;
import br.com.mad.repository.LedgerRecordRepository;
import br.com.mad.repository.UserRepository;
import br.com.mad.repository.WalletRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DemoDataInitializerTest {
    @Mock UserRepository users;
    @Mock WalletRepository wallets;
    @Mock AssetRepository assets;
    @Mock LedgerRecordRepository records;
    @Mock PasswordEncoder passwordEncoder;

    @Test
    void naoAlteraNenhumDadoQuandoEmailJaExiste() {
        User existingUser = new User("Usuário existente", "demonstracao@mad.local", "hash");
        when(users.findByEmailIgnoreCase("demonstracao@mad.local")).thenReturn(Optional.of(existingUser));

        initializer().run(null);

        verify(users).findByEmailIgnoreCase("demonstracao@mad.local");
        verify(users, never()).save(any());
        verifyNoInteractions(wallets, assets, records, passwordEncoder);
    }

    @Test
    void ignoraCargaSemImpedirInicializacaoQuandoAtivoObrigatorioEstaAusente() {
        Asset availableAsset = new Asset("PETR4", "Petrobras PN", Asset.Category.ACAO, null);
        when(users.findByEmailIgnoreCase("demonstracao@mad.local")).thenReturn(Optional.empty());
        when(assets.findByActiveTrueOrderByTicker()).thenReturn(List.of(availableAsset));

        assertThatCode(() -> initializer().run(null)).doesNotThrowAnyException();

        assertThat(availableAsset.getCurrentPrice()).isNull();
        verify(users, never()).save(any());
        verifyNoInteractions(wallets, records, passwordEncoder);
    }

    private DemoDataInitializer initializer() {
        return new DemoDataInitializer(users, wallets, assets, records, passwordEncoder, true,
                "Marina Oliveira", "demonstracao@mad.local", "Mad@12345");
    }
}
