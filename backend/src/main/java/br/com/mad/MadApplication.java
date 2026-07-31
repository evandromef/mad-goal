package br.com.mad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MadApplication {
    public static void main(String[] args) {
        SpringApplication.run(MadApplication.class, args);
    }
}
