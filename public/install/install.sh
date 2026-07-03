#!/usr/bin/env sh
set -e

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
esac

BINARY="windkeep-$OS-$ARCH"
INSTALL_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
TMP="$(mktemp)"

cleanup() {
  rm -f "$TMP"
}
trap cleanup EXIT

mkdir -p "$INSTALL_DIR"
curl -fsSL "https://windkeep.up.railway.app/api/downloads/$BINARY" -o "$TMP"

EXPECTED="$(curl -fsSL "https://windkeep.up.railway.app/api/downloads/checksums.txt" | awk -v bin="$BINARY" '$2 == bin { print $1; exit }')"
if [ -z "$EXPECTED" ]; then
  echo "error: checksum not found for $BINARY" >&2
  exit 1
fi

ACTUAL="$(sha256sum "$TMP" | awk '{ print $1 }')"
if [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "error: checksum mismatch for $BINARY" >&2
  exit 1
fi

mv "$TMP" "$INSTALL_DIR/windkeep"
trap - EXIT
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
