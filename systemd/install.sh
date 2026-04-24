#!/usr/bin/env bash
# Install the Idoldle systemd services for auto-restart + reboot survival.
# Run once from the idoldle/ directory (or anywhere — paths are absolute).
#
# Usage:
#   sudo ./systemd/install.sh

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "This script needs sudo. Re-run: sudo $0"
  exit 1
fi

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing unit files from ${SRC_DIR} to /etc/systemd/system/ ..."
install -m 0644 "${SRC_DIR}/idoldle-preview.service"    /etc/systemd/system/idoldle-preview.service
install -m 0644 "${SRC_DIR}/cloudflared-idoldle.service" /etc/systemd/system/cloudflared-idoldle.service

echo "Reloading systemd..."
systemctl daemon-reload

echo "Enabling + starting services..."
systemctl enable --now idoldle-preview.service
systemctl enable --now cloudflared-idoldle.service

echo
echo "Done. Status:"
systemctl --no-pager status idoldle-preview.service | head -10
echo
systemctl --no-pager status cloudflared-idoldle.service | head -10
echo
echo "Public URL: https://idoldle.edriffles.us"
echo "If the URL was already served by a background process, kill it:"
echo "  pkill -f 'vite preview' ; pkill cloudflared"
echo "...then confirm the service restarted it:"
echo "  systemctl status idoldle-preview cloudflared-idoldle"
