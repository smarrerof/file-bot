# file-bot

[🇪🇸 Español](#español) · [🇬🇧 English](#english)

---

## Español

Un bot de telegram que sirve para descargar archivos directamente en tu NAS. Puedes determinar en qué carpeta se descarga cada tipo de archivo. Los ficheros detectados son:

- Archivos de tipo audio
- Archivos de tipo documento
- Archivos de tipo foto
- Archivos de tipo torrent
- Archivos de tipo video

En los mensajes de texto se busca una URL y si existe se descarga el archivo. El fichero descargado va a su carpeta correspondiente siguiendo las mismas reglas que las descargas de archivos directos.

Puedes usar la imagen docker de este proyecto directamente en [Docker Hub](https://hub.docker.com/r/smarrerof/file-bot)

### Versión

**v0.2** — Múltiples destinos por tipo de archivo, configuración en YAML, logging mejorado.

---

### Nuevas features (v0.2)

#### 🎯 Múltiples destinos configurables

Ahora puedes enrutar cada tipo de archivo a **múltiples destinos**. Si configuras más de uno, el bot te preguntará cuál usar.

**Ejemplo:** PDFs a `/documents` Y a `/paperless/consume`

```yaml
# routing.yaml
destinations:
  document:
    - label: Documents
      path: /documents        # ruta dentro del contenedor (debe estar montada como volumen)
    - label: Paperless
      path: /paperless/consume  # ruta dentro del contenedor (debe estar montada como volumen)
```

> **Importante:** los `path` son rutas **dentro del contenedor**. Cada path debe tener su correspondiente entrada en `volumes` del docker-compose apuntando a la carpeta real en el host.

Cuando subes un PDF, el bot te pregunta dónde guardarlo:
```
Where should I save documento.pdf?
[Documents]  [Paperless]
```

#### 📋 Configuración en YAML montado

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

#### ⏱️ Logging con timestamps

Todos los logs ahora incluyen timestamps y van a stdout para que `docker logs` funcione correctamente:

```
[2024-04-16 14:23:45] 🔵 documento.pdf detected as document
[2024-04-16 14:23:45] 🔵 Destination selected: Paperless (/paperless/consume)
[2024-04-16 14:23:46] 🟢 documento.pdf downloaded to /paperless/consume/documento.pdf
```

---

### Configuración

| Clave | Obligatorio | Valor |
|---|---|---|
|TELEGRAM_BOT_TOKEN|🟢 Sí|Token del bot de telegram. El valor se parecerá a algo como esto 4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc|
|TELEGRAM_CHAT_ID|🟢 Sí|Identificador del usuario.|
|CONFIG_DIR|🟠 No|Directorio de configuración. Por defecto `./config`|
|DOWNLOAD_DEFAULT_PATH|🟠 No|Ruta de la carpeta para descargas. Por defecto `/downloads`|

#### Estructura de configuración

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

#### Sin carpeta `config/`

Si no existe `config/routing.yaml`, el bot funciona con valores por defecto (un único destino por tipo apuntando a `/downloads`).

---

### Uso local con `npm start`

```bash
npm install
npm start
```

Requiere la carpeta `config/` con `config/routing.yaml` (o funcionará con defaults).

---

### Uso con docker-compose en modo local

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

### Uso con docker-compose desde Docker Hub

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
      - ./config:/config          # carpeta con routing.yaml (obligatorio para usar rutas personalizadas)
      - /host/downloads:/downloads  # destino por defecto
      # Añade un volumen por cada path definido en routing.yaml:
      # - /host/documents:/documents
      # - /host/paperless/consume:/paperless/consume
      # - /host/torrents:/torrents
    restart: unless-stopped
    tty: true
```

---

## English

A Telegram bot that downloads files directly to your NAS. You can define which folder each file type is saved to. Supported file types:

- Audio files
- Document files
- Photo files
- Torrent files
- Video files

Text messages are scanned for URLs — if one is found, the file is downloaded. The file is routed to its corresponding folder following the same rules as direct file uploads.

The Docker image is available on [Docker Hub](https://hub.docker.com/r/smarrerof/file-bot)

### Version

**v0.2** — Multiple destinations per file type, YAML-based configuration, improved logging.

---

### New features (v0.2)

#### 🎯 Configurable multiple destinations

You can now route each file type to **multiple destinations**. If more than one is configured, the bot will ask you which one to use.

**Example:** PDFs to `/documents` AND to `/paperless/consume`

```yaml
# routing.yaml
destinations:
  document:
    - label: Documents
      path: /documents        # path inside the container (must be mounted as a volume)
    - label: Paperless
      path: /paperless/consume  # path inside the container (must be mounted as a volume)
```

> **Important:** `path` values are paths **inside the container**. Each path must have a corresponding `volumes` entry in docker-compose pointing to the actual folder on the host.

When you send a PDF, the bot asks where to save it:
```
Where should I save document.pdf?
[Documents]  [Paperless]
```

#### 📋 YAML-mounted configuration

Destination and extension configuration now lives in `routing.yaml` (mounted as a Docker volume), not in environment variables. Much more flexible and readable.

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

#### ⏱️ Timestamped logging

All logs now include timestamps and go to stdout so that `docker logs` works correctly:

```
[2024-04-16 14:23:45] 🔵 documento.pdf detected as document
[2024-04-16 14:23:45] 🔵 Destination selected: Paperless (/paperless/consume)
[2024-04-16 14:23:46] 🟢 documento.pdf downloaded to /paperless/consume/documento.pdf
```

---

### Configuration

| Key | Required | Value |
|---|---|---|
|TELEGRAM_BOT_TOKEN|🟢 Yes|Telegram bot token. It looks something like 4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc|
|TELEGRAM_CHAT_ID|🟢 Yes|Your Telegram user ID.|
|CONFIG_DIR|🟠 No|Configuration directory. Defaults to `./config`|
|DOWNLOAD_DEFAULT_PATH|🟠 No|Default download folder path. Defaults to `/downloads`|

#### Configuration structure

All configuration files go in the `config/` folder:

```
config/
├── routing.yaml           # Destinations and extensions (created from .example)
└── routing.example.yaml   # Example template (versioned)
```

Future extensions:
```
config/
├── routing.yaml
├── file-types.yaml        # (Future) Custom type definitions
├── rules.yaml             # (Future) Custom routing logic
└── *.example.yaml
```

#### Without a `config/` folder

If `config/routing.yaml` does not exist, the bot falls back to defaults (one destination per type pointing to `/downloads`).

---

### Running locally with `npm start`

```bash
npm install
npm start
```

Requires the `config/` folder with `config/routing.yaml` (or it will run with defaults).

---

### Running with docker-compose locally

Rename `.env_example` to `.env` and fill in at least `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

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

To configure destinations, edit `config/routing.yaml` (copy from `config/routing.example.yaml` if it doesn't exist).

---

### Running with docker-compose from Docker Hub

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
      - ./config:/config          # folder with routing.yaml (required for custom paths)
      - /host/downloads:/downloads  # default destination
      # Add one volume per path defined in routing.yaml:
      # - /host/documents:/documents
      # - /host/paperless/consume:/paperless/consume
      # - /host/torrents:/torrents
    restart: unless-stopped
    tty: true
```
