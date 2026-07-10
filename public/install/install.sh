#!/usr/bin/env sh
set -e

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
if [ "$OS" != "linux" ]; then
  echo "error: this installer only supports Linux" >&2
  exit 1
fi

BINARY="windkeep-linux-amd64"
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
ln -sf "$INSTALL_DIR/windkeep" "$INSTALL_DIR/wk"

on_path=0
case ":$PATH:" in *":$INSTALL_DIR:"*) on_path=1 ;; esac

path_updated=0
if [ "$on_path" -eq 0 ]; then
  export PATH="$INSTALL_DIR:$PATH"
  case "${SHELL:-}" in
    */zsh) rc="$HOME/.zshrc" ;;
    *) rc="$HOME/.bashrc" ;;
  esac
  if [ -f "$rc" ] && ! grep -qF "$INSTALL_DIR" "$rc" 2>/dev/null; then
    printf '\n# WindKeep CLI\nexport PATH="%s:$PATH"\n' "$INSTALL_DIR" >> "$rc"
    path_updated=1
  fi
fi

echo "WindKeep installed."
if [ "$path_updated" -eq 1 ]; then
  echo "Restart your terminal or run: source $rc"
elif [ "$on_path" -eq 0 ]; then
  echo "Add $INSTALL_DIR to your PATH, then restart your terminal."
fi
echo "Run windkeep --version to verify."
