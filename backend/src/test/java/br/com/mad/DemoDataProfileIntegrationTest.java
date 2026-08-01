package br.com.mad;

import br.com.mad.config.DemoDataInitializer;
import br.com.mad.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "app.demo-data.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:mad-no-demo;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"
})
@ActiveProfiles("test")
class DemoDataProfileIntegrationTest {
    @Autowired ApplicationContext context;
    @Autowired UserRepository users;

    @Test
    void naoInicializaDadosDeDemonstracaoForaDoPerfilDeDesenvolvimento() {
        assertThat(context.getBeansOfType(DemoDataInitializer.class)).isEmpty();
        assertThat(users.findByEmailIgnoreCase("demonstracao@mad.local")).isEmpty();
    }
}
