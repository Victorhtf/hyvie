# Hyvie

Um dashboard elegante e personalizável para gerenciar e acessar todos os seus serviços em um só lugar, inspirado no conceito de colmeia (hive).

![Hyvie Screenshot](screenshot.png)

## Características

- 🚀 Interface moderna e responsiva
- 🌓 Modo claro/escuro
- 📊 Verificação de status dos serviços
- ⭐ Favoritos para acesso rápido
- 🔄 Arrastar e soltar para organizar serviços
- 📱 Otimizado para desktop e dispositivos móveis
- 🔧 Configuração simples via interface gráfica ou YAML/JSON
- 🐳 Fácil de implantar com Docker

## Início Rápido com Docker

```bash
docker run -d \
  --name hyvie \
  -p 3000:3000 \
  -v hyvie-data:/data \
  -e STORAGE_TYPE=json \
  -e STORAGE_PATH=/data/hyvie-config.json \
  yourusername/hyvie:latest
