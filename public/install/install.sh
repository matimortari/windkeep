#!/usr/bin/env sh
set -e

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
esac

BINARY="windkeep-$OS-$ARCH"
URL="https://windkeep.up.railway.app/api/downloads/$BINARY"

INSTALL_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"

mkdir -p "$INSTALL_DIR"
curl -fsSL "$URL" -o "$INSTALL_DIR/windkeep"
chmod +x "$INSTALL_DIR/windkeep"

echo "WindKeep installed at $INSTALL_DIR/windkeep"
echo ""
echo "Add the following directory to your PATH:"
echo "  $INSTALL_DIR"
echo ""
echo "For bash/zsh, you can run:"
echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
echo ""
echo "Then restart your terminal and run:"
echo "  windkeep --version"
