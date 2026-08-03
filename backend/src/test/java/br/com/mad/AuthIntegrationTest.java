package br.com.mad;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    @Test
    void cadastraAutenticaECriaCarteiraIsolada() throws Exception {
        String registration = """
                {"name":"Ana","email":"ana@example.com","password":"senha-segura"}
                """;
        String registrationResponse = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(registration))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificationToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String verificationToken = mapper.readTree(registrationResponse).get("verificationToken").asText();
        String response = mvc.perform(post("/api/auth/confirm-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("token", verificationToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = mapper.readTree(response);
        String token = json.get("token").asText();

        mvc.perform(post("/api/wallets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Carteira Principal\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Carteira Principal"));

        mvc.perform(get("/api/wallets"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/wallets").header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejeitaCredenciaisInvalidas() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"inexistente@example.com\",\"password\":\"senha-errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("E-mail ou senha inválidos."));
    }

    @Test
    void exigeConfirmacaoRenovaSessaoERecusaReusoDoRefresh() throws Exception {
        String registration = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Rui\",\"email\":\"rui@example.com\",\"password\":\"senha-segura\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"rui@example.com\",\"password\":\"senha-segura\"}"))
                .andExpect(status().isForbidden());
        String verification = mapper.readTree(registration).get("verificationToken").asText();
        JsonNode session = mapper.readTree(mvc.perform(post("/api/auth/confirm-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("token", verification))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String refresh = session.get("refreshToken").asText();
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("token", refresh))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.refreshToken").isNotEmpty());
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("token", refresh))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recuperaSenhaComTokenDescartavel() throws Exception {
        String registration = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Sol\",\"email\":\"sol@example.com\",\"password\":\"senha-antiga\"}"))
                .andReturn().getResponse().getContentAsString();
        String verification = mapper.readTree(registration).get("verificationToken").asText();
        String confirmation = mvc.perform(post("/api/auth/confirm-email").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("token", verification))))
                .andReturn().getResponse().getContentAsString();
        String previousRefresh = mapper.readTree(confirmation).get("refreshToken").asText();
        String forgot = mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sol@example.com\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String reset = mapper.readTree(forgot).get("verificationToken").asText();
        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("token", reset, "password", "senha-nova"))))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sol@example.com\",\"password\":\"senha-nova\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("token", previousRefresh))))
                .andExpect(status().isUnauthorized());
    }
}
