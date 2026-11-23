# Imagem de produção (Render): um container só, com a API Quarkus entregando também o site Angular.
# No notebook nada disso é usado: lá rodam o ng serve e o quarkus:dev (ver README).
# Passo a passo da hospedagem: docs/hospedagem-render.md

# 1) Compila o site (Angular)
FROM node:22 AS site
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npx ng build

# 2) Compila a API com o site dentro (META-INF/resources é servido pelo Quarkus na raiz)
FROM maven:3.9-eclipse-temurin-21 AS api
WORKDIR /app
COPY api/pom.xml ./
RUN mvn -q -B dependency:go-offline || true
COPY api/src ./src
COPY --from=site /web/dist/web/browser ./src/main/resources/META-INF/resources
# Os testes precisam de Docker (Postgres descartável): rodam no PC com ./mvnw test
RUN mvn -q -B package -DskipTests

# 3) Só o necessário para rodar (JRE), sem root
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=api /app/target/quarkus-app/ ./
RUN useradd --system --no-create-home --uid 10001 hidra
USER hidra
# O plano grátis do Render tem 512 MB: deixa a JVM usar até 70% disso
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70"
EXPOSE 10000
CMD ["java", "-jar", "quarkus-run.jar"]
