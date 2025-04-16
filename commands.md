# Useful commands

## Doker

### Build Docker image and push it to docker hub
> $ VERSION=0.1.0 npm run build

> $ VERSION=latest npm run build

### Docker clean cache 
Add `--no-cache` parameter to build command

[How to clear docker cache](https://techkluster.com/docker/questions-docker/how-to-clear-docker-cache/)

> $ docker builder prune

> $ docker system prune


## Git

### Tag a version
> $ git tag -a 0.1.0 -m "0.1.0"

> $ git push origin tag 0.1.0