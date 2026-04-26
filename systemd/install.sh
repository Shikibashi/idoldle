#!/usr/bin/env bash
# Install the Idoldle services as USER-level systemd units.
# Designed for Fedora Bluefin (uBlue atomic) — system-level units can't
# exec /home/linuxbrew/ binaries under SELinux enforcement, but user
# services run with the user's own SELinux context and work fine.
#
# Usage:
#   ./systemd/install.sh
#
# A single sudo prompt is needed at the end to enable-linger so the
# services keep running when you're logged out / after reboot.

set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
USER_UNIT_DIR="${HOME}/.config/systemd/user"

echo "Installing user unit files to ${USER_UNIT_DIR} ..."
mkdir -p "${USER_UNIT_DIR}"
install -m 0644 "${SRC_DIR}/idoldle-preview.service"     "${USER_UNIT_DIR}/idoldle-preview.service"
install -m 0644 "${SRC_DIR}/cloudflared-idoldle.service" "${USER_UNIT_DIR}/cloudflared-idoldle.service"

echo "Reloading user systemd..."
systemctl --user daemon-reload

echo "Enabling + starting services..."
systemctl --user enable --now idoldle-preview.service
systemctl --user enable --now cloudflared-idoldle.service

echo
echo "Enabling user lingering (requires one sudo prompt) so services"
echo "keep running without an active login session and survive reboot..."
sudo loginctl enable-linger "$(id -un)"

echo
echo "=== Status ==="
systemctl --user --no-pager status idoldle-preview.service     | head -6
echo
systemctl --user --no-pager status cloudflared-idoldle.service | head -6
echo
echo "Done. Public URL: https://idoldle.edriffles.us"
echo
echo "Future ops (no sudo required for these):"
echo "  systemctl --user status idoldle-preview cloudflared-idoldle"
echo "  systemctl --user restart idoldle-preview"
echo "  journalctl --user -u cloudflared-idoldle -f"
