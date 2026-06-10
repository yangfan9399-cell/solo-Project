FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["HazardousGoodsYard.csproj", "./"]
RUN dotnet restore "HazardousGoodsYard.csproj"
COPY . .
WORKDIR "/src/"
RUN dotnet build "HazardousGoodsYard.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HazardousGoodsYard.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HazardousGoodsYard.dll"]