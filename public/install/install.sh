#!/usr/bin/env sh
set -e

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
esac

BINARY="windkeep-$OS-$ARCH"
URL="https://windkeep.app/api/downloads/$BINARY"

INSTALL_DIR="$HOME/.windkeep/bin"

mkdir -p "$INSTALL_DIR"

curl -fsSL "$URL" -o "$INSTALL_DIR/windkeep"
chmod +x "$INSTALL_DIR/windkeep"

echo "WindKeep installed at $INSTALL_DIR/windkeep"
echo "Make sure $INSTALL_DIR is in your PATH"
