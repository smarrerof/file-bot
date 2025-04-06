# file-bot
Un bot de telegram que sirve para descargar archivos directamente en tu NAS. Puedes determinar en que carpeta se descarga cada tipo de archivo. Los fichero detectados son

- Archivos de tipo torrent 
- Archivos de tipo foto
- Archivos de tipo documento

En los mensajes de texto se busca un url y si coincide esta se decarga también y el fichero descargado va a su carpeta correspondiente siguiendo las mismas reglas que la descargas de archivos directa.

Puedes usar la imagen docker de este proyecto directamente en [Docker Hub](https://hub.docker.com/r/smarrerof/file-bot)


## Configuración
| Clave | Obligatorio | Valor |
|---|---|---|
|TELEGRAM_BOT_TOKEN|🟢 Sí|Token del bot de telegram. El valor se parecerá a algo como esto 4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc|
|TELEGRAM_CHAT_ID|🟢 Sí|Identificador del usuario.|
|DOWNLOAD_DEFAULT_PATH|🟠 No|Ruta de la carpeta para descargas. Por defecto `/downloads`|
|DOWNLOAD_DOCUMENT_PATH|🟠 No|Ruta de la carpeta para descargas de ficheros de tipo documento (.doc, .docx, .pdf, .ppt, .pptx, .txt, .xls, .xlsx). Si no se especifica se usa `DOWNLOAD_DEFAULT_PATH`|
|DOWNLOAD_PHOTO_PATH|🟠 No|Ruta de la carpeta para descargas de ficheros de tipo foto (.bmp, .gif, .jpeg, .jpg, .png, .svg, .tiff, .webp). Si no se especifica se usa `DOWNLOAD_DEFAULT_PATH`|
|DOWNLOAD_TORRENT_PATH|🟠 No|Ruta de la carpeta para descargas de ficheros de tipo torrent (.torrent). Si no se especifica se usa `DOWNLOAD_DEFAULT_PATH`|

## Uso con doker-compose en modo local
Renombrar el fichero .env_example a .env y rellenar el menos las variables `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
```
services:
  dropbot:
    container_name: file-bot-dev
    env_file:
      - .env
    build:
      context: .
      dockerfile: ./Dockerfile.dev
    volumes:
      - <tu ruta para descargas>:/downloads
      # - <tu ruta para descargas de tipo documento>:/documents
      # - <tu ruta para descargas de tipo fotos>:/photos
      # - <tu ruta para descargas de tipo torrent>:/torrents
    tty: true
```

## Uso con doker-compose desde docker hub
```
services:
  dropbot:
    image: smarrerof/file-bot:latest
    container_name: file-bot
    network_mode: host
    environment
      - TELEGRAM_BOT_TOKEN=
      - TELEGRAM_CHAT_ID=
      # - DOWNLOAD_DOCUMENT_PATH=/documents
      # - DOWNLOAD_PHOTO_PATH=/photos
      # - DOWNLOAD_TORRENT_PATH=/torrents
    volumes:
      - <tu ruta para descargas>:/downloads
      # - <tu ruta para descargas de tipo documento>:/documents
      # - <tu ruta para descargas de tipo fotos>:/photos
      # - <tu ruta para descargas de tipo torrent>:/torrents
    restart: unless-stopped
    tty: true
```