# Stage 1: Build the Spring Boot WAR with pre-bundled static resources
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

COPY pom.xml ./
COPY src src/

# Build WAR with pre-bundled frontend in static resources
RUN mvn clean package -DskipTests -DskipFrontend=true

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /build/target/demo-0.0.1-SNAPSHOT.war app.war

EXPOSE 8080

ENV SERVER_ADDRESS=0.0.0.0 \
    PORT=8080 \
    JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -Xss512k -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["java", "-jar", "/app/app.war"]
