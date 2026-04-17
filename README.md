# file-bot

Un bot de telegram que sirve para descargar archivos directamente en tu NAS. Puedes determinar en qué carpeta se descarga cada tipo de archivo. Los ficheros detectados son:

- Archivos de tipo audio
- Archivos de tipo documento
- Archivos de tipo foto
- Archivos de tipo torrent
- Archivos de tipo video

En los mensajes de texto se busca una URL y si existe se descarga el archivo. El fichero descargado va a su carpeta correspondiente siguiendo las mismas reglas que las descargas de archivos directos.

Puedes usar la imagen docker de este proyecto directamente en [Docker Hub](https://hub.docker.com/r/smarrerof/file-bot)

## Versión

**v0.2** — Múltiples destinos por tipo de archivo, configuración en YAML, logging mejorado.

---

## Nuevas features (v0.2)

### 🎯 Múltiples destinos configurables

Ahora puedes enrutar cada tipo de archivo a **múltiples destinos**. Si configuras más de uno, el bot te preguntará cuál usar.

**Ejemplo:** PDFs a `/documents` Y a `/paperless/consume`

```yaml
# routing.yaml
destinations:
  document:
    - label: Documents
      path: /documents
    - label: Paperless
      path: /paperless/consume
```

Cuando subes un PDF, el bot te pregunta dónde guardarlo:
```
Where should I save documento.pdf?
[Documents]  [Paperless]
```

### 📋 Configuración en YAML montado

La configuración de destinos y extensiones ahora va en `routing.yaml` (montado como volumen Docker), no en variables de entorno. Mucho más flexible y legible.

```yaml
destinations:
  document: [...]
  torrent: [...]
  audio: [...]
  photo: [...]
  video: [...]

extensions:
  audio: [.mp3, .flac, .wav, ...]
  document: [.pdf, .doc, .docx, ...]
  # ... etc
```

### ⏱️ Logging con timestamps

Todos los logs ahora incluyen timestamps y van a stdout para que `docker logs` funcione correctamente:

```
[2024-04-16 14:23:45] 🔵 documento.pdf detected as document
[2024-04-16 14:23:45] 🔵 Destination selected: Paperless (/paperless/consume)
[2024-04-16 14:23:46] 🟢 documento.pdf downloaded to /paperless/consume/documento.pdf
```

---

## Configuración

| Clave | Obligatorio | Valor |
|---|---|---|
|TELEGRAM_BOT_TOKEN|🟢 Sí|Token del bot de telegram. El valor se parecerá a algo como esto 4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc|
|TELEGRAM_CHAT_ID|🟢 Sí|Identificador del usuario.|
|CONFIG_DIR|🟠 No|Directorio de configuración. Por defecto `./config`|
|DOWNLOAD_DEFAULT_PATH|🟠 No|Ruta de la carpeta para descargas. Por defecto `/downloads`|

### Estructura de configuración

Todos los ficheros de configuración van en la carpeta `config/`:

```
config/
├── routing.yaml           # Destinos y extensiones (generado a partir de .example)
└── routing.example.yaml   # Plantilla de ejemplo (versionada)
```

Futuras extensiones:
```
config/
├── routing.yaml
├── file-types.yaml        # (Futuro) Definiciones personalizadas de tipos
├── rules.yaml             # (Futuro) Lógica personalizada
└── *.example.yaml
```

### Sin carpeta `config/`

Si no existe `config/routing.yaml`, el bot funciona con valores por defecto (un único destino por tipo apuntando a `/downloads`).

---

## Uso local con `npm start`

```bash
npm install
npm start
```

Requiere la carpeta `config/` con `config/routing.yaml` (o funcionará con defaults).

---

## Uso con docker-compose en modo local

Renombrar el fichero `.env_example` a `.env` y rellenar al menos las variables `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.

```yaml
services:
  dropbot:
    container_name: file-bot-dev
    env_file:
      - .env
    build:
      context: .
      dockerfile: ./Dockerfile.dev
    volumes:
      - ./config:/config
      - ./downloads:/downloads
      # Mount additional destinations defined in config/routing.yaml:
      # - <documents-path>:/documents
      # - <paperless-path>:/paperless/consume
      # - <qbit-path>:/qbit/watch
    tty: true
```

Para configurar los destinos, edita `config/routing.yaml` (copia `config/routing.example.yaml` si no existe).

---

## Uso con docker-compose desde Docker Hub

```yaml
services:
  dropbot:
    image: smarrerof/file-bot:latest
    container_name: file-bot
    network_mode: host
    environment:
      - TELEGRAM_BOT_TOKEN=
      - TELEGRAM_CHAT_ID=
    volumes:
      - ./config:/config
      - ./downloads:/downloads
    restart: unless-stopped
    tty: true
```
