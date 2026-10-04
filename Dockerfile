# Stage 1: Build backend & frontend
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /build

# Copy maven wrapper & pom
COPY pom.xml mvnw ./
COPY .mvn .mvn/

RUN chmod +x ./mvnw

# Copy frontend source
COPY frontend frontend/

# Copy java source & resources
COPY src src/

# Build project with frontend integration
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /build/target/demo-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV SERVER_ADDRESS=0.0.0.0 \
    PORT=8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
