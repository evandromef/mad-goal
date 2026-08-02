package br.com.mad;

import br.com.mad.domain.Asset;
import br.com.mad.domain.User;
import br.com.mad.repository.AssetRepository;
import br.com.mad.repository.UserRepository;
import br.com.mad.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiFlowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired AssetRepository assets;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;

    @Test
    void executaCrudCarteiraLancamentoNotaEConsolidaProventos() throws Exception {
        String token = token("Lia", "lia@example.com");
        Asset asset = assets.findByActiveTrueOrderByTicker().getFirst();
        String walletId = createWallet(token, "Principal");

        String purchase = json(Map.of("walletId", walletId, "assetId", asset.getId(), "type", "COMPRA",
                "date", "2026-01-10", "quantity", "10.12345678", "totalValue", "1000.12345678"));
        String record = mvc.perform(post("/api/records").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(purchase))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(10.12345678))
                .andReturn().getResponse().getContentAsString();
        String recordId = mapper.readTree(record).get("id").asText();

        mvc.perform(put("/api/records/{id}", recordId).header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(purchase.replace("1000.12345678", "1100.12345678")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalValue").value(1100.12345678));

        String income = json(Map.of("walletId", walletId, "assetId", asset.getId(), "type", "DIVIDENDO",
                "date", "2026-04-10", "totalValue", "45.12"));
        mvc.perform(post("/api/records").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(income))
                .andExpect(status().isCreated());

        String note = json(Map.of("walletId", walletId, "assetId", asset.getId(), "content", "Tese inicial"));
        String noteResponse = mvc.perform(post("/api/notes").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(note))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String noteId = mapper.readTree(noteResponse).get("id").asText();
        mvc.perform(put("/api/notes/{id}", noteId).header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(note.replace("inicial", "revisada")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content").value("Tese revisada"));

        mvc.perform(get("/api/incomes").header("Authorization", bearer(token))
                        .param("walletId", walletId).param("category", asset.getCategory().name())
                        .param("from", "2026-01-01").param("to", "2026-12-31").param("groupBy", "QUARTERLY"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(45.12))
                .andExpect(jsonPath("$.groups[0].period").value("2026-T2"));
        mvc.perform(get("/api/dashboard/{id}", walletId).header("Authorization", bearer(token))
                .param("granularity", "YEARLY"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.positions[0].ticker").value(asset.getTicker()))
                .andExpect(jsonPath("$.positions[0].totalIncome").value(45.12))
                .andExpect(jsonPath("$.positions[0].currentValue").doesNotExist());
        mvc.perform(get("/api/assets").header("Authorization", bearer(token)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].ticker").isNotEmpty());

        mvc.perform(delete("/api/notes/{id}", noteId).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/records/{id}", recordId).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mvc.perform(put("/api/wallets/{id}", walletId).header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Longo prazo\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Longo prazo"));
        mvc.perform(delete("/api/wallets/{id}", walletId).header("Authorization", bearer(token))
                        .param("confirm", "true"))
                .andExpect(status().isNoContent());
    }

    @Test
    void isolaDadosEntreUsuarios() throws Exception {
        String owner = token("Nina", "nina@example.com");
        String intruder = token("Otto", "otto@example.com");
        String walletId = createWallet(owner, "Privada");
        mvc.perform(get("/api/dashboard/{id}", walletId).header("Authorization", bearer(intruder)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/records").header("Authorization", bearer(intruder)).param("walletId", walletId))
                .andExpect(status().isNotFound());
    }

    @Test
    void atualizaEExcluiPerfil() throws Exception {
        String token = token("Ula", "ula@example.com");
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Ula"));
        mvc.perform(put("/api/profile").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ula Nova\",\"email\":\"ula.nova@example.com\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Ula Nova"));
        mvc.perform(delete("/api/profile").header("Authorization", bearer(token)).param("confirm", "true"))
                .andExpect(status().isNoContent());
    }

    private String createWallet(String token, String name) throws Exception {
        JsonNode response = mapper.readTree(mvc.perform(post("/api/wallets")
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", name)))).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        return response.get("id").asText();
    }
    private String token(String name, String email) {
        User user = new User(name, email, encoder.encode("senha-segura"));
        user.verifyEmail();
        users.save(user);
        return jwt.create(user);
    }
    private String bearer(String token) { return "Bearer " + token; }
    private String json(Object body) throws Exception { return mapper.writeValueAsString(body); }
}
