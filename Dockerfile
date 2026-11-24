# VoltCart: صورة واحدة فيها الـ API (.NET 10) والموقع (Angular) مع بعض، على port واحد.
# بناء:  docker build -t voltcart .      تشغيل: شوف docker-compose.yml و docs/DEPLOY.md

# ---- 1) بناء الموقع (Angular)
FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npx ng build

# ---- 2) نشر الـ API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
COPY api/VoltCart.Api.csproj api/
RUN dotnet restore api/VoltCart.Api.csproj
COPY api/ api/
RUN dotnet publish api/VoltCart.Api.csproj -c Release -o /out --no-restore

# ---- 3) الصورة النهائية: runtime بس
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=api /out ./
# ملفات الموقع في wwwroot: الـ API بيخدمها (انظر Program.cs)
COPY --from=web /web/dist/web/browser ./wwwroot

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=8080 \
    Proxy__TrustForwardedHeaders=true
EXPOSE 8080

# مش root
USER $APP_UID
ENTRYPOINT ["dotnet", "VoltCart.Api.dll"]
