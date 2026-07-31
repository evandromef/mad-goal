FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S mad && adduser -S mad -G mad
WORKDIR /app
COPY --from=build /workspace/target/mad-backend-*.jar app.jar
USER mad
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
