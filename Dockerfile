FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend

COPY zenith-catalog-glow-main/package.json zenith-catalog-glow-main/package-lock.json ./
RUN npm ci

COPY zenith-catalog-glow-main/ ./

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM maven:3.9.9-eclipse-temurin-17 AS backend-build
WORKDIR /app

COPY zenith-catalog-glow-main/backend/pom.xml backend/pom.xml
RUN mvn -f backend/pom.xml -B dependency:go-offline

COPY zenith-catalog-glow-main/backend/src backend/src
COPY --from=frontend-build /app/frontend/dist backend/src/main/resources/static

RUN mvn -f backend/pom.xml -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

ENV PORT=10000
ENV APP_UPLOAD_DIR=/var/data/uploads

COPY --from=backend-build /app/backend/target/catalog-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:-} -jar /app/app.jar"]
