#!/bin/bash
set -e

FORCE=false
VERSION=""

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      echo "Usage: ./release.sh [options] <version>"
      echo ""
      echo "  Bumps version, merges develop → main, tags, and builds the Docker image."
      echo ""
      echo "  Arguments:"
      echo "    <version>          Semantic version to release (e.g. 0.2.1)"
      echo ""
      echo "  Options:"
      echo "    -f, --force        Skip clean working tree check"
      echo "    -h, --help         Show this help message"
      exit 0
      ;;
    -f|--force)
      FORCE=true
      ;;
    *)
      VERSION="$arg"
      ;;
  esac
done

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh [options] <version>  (e.g. ./release.sh 0.2.1)"
  exit 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: invalid version '$VERSION', expected format X.Y.Z (e.g. 0.2.1)"
  exit 1
fi

# Ensure Docker daemon is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker daemon is not running"
  exit 1
fi

# Ensure we're on develop
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "Error: must be on develop branch (currently on $CURRENT_BRANCH)"
  exit 1
fi

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  if [ "$FORCE" = true ]; then
    echo "Warning: working tree is not clean, continuing anyway (--force)"
  else
    echo "Error: working tree is not clean, commit or stash changes first"
    echo "       Use -f or --force to skip this check"
    exit 1
  fi
fi

# 1. Bump version in package.json + package-lock.json
npm version "$VERSION" --no-git-tag-version

# 2. Commit and push develop
git add package.json package-lock.json
git commit -m "chore: bump version to $VERSION"
git push origin develop

# 3. Merge to main, tag, push
git checkout main
git merge develop --ff-only
git tag -a "$VERSION" -m "$VERSION"
git push origin main
git push origin "$VERSION"
gh release create "$VERSION" --title "$VERSION" --generate-notes

# 4. Build and push Docker image (version tag + latest)
docker buildx build --no-cache --push \
  -t "smarrerof/file-bot:$VERSION" \
  -t "smarrerof/file-bot:latest" \
  --platform linux/amd64,linux/arm64/v8 .

# 5. Back to develop, sync with main
git checkout develop
git merge main --ff-only

echo "Released v$VERSION successfully"
