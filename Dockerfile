FROM eclipse-temurin:21-jre

WORKDIR /app

COPY target/demo-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV SERVER_ADDRESS=0.0.0.0 \
    PORT=8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
