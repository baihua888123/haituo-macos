#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'DMG build requires macOS. This script has not produced an installer.'
  exit 2
fi
command -v node >/dev/null
command -v python3 >/dev/null
ARCH="$(uname -m)"
[[ "$ARCH" == arm64 ]] || ARCH=x64
python3 macos/prepare-native.py
python3 macos/patch-account-windows.py
python3 macos/patch-window-lifecycle.py
python3 macos/patch-native-interface.py
python3 macos/patch-message-scanning.py
node --check macos/staging/app/bundles/main.js
node --check macos/staging/app/bundles/preload/main.js
node --check macos/staging/app/js/caisheng-webview-preload.js
npx --yes @electron/packager@18.3.6 macos/staging/app 海拓 --platform=darwin --arch="$ARCH" --electron-version=44.1.0 --app-version=1.1.12 --build-version=1.1.12 --app-bundle-id=com.haituo.desktop --out=macos/out --overwrite --no-prune --asar.unpack='**/*.node' --extend-info=macos/Info.plist
APP="macos/out/海拓-darwin-$ARCH/海拓.app"
codesign --force --deep --sign - --entitlements macos/entitlements.plist "$APP"
codesign --verify --deep --strict "$APP"
mkdir -p macos/image
rm -rf macos/image/海拓.app
cp -R "$APP" macos/image/
[[ -L macos/image/Applications ]] || ln -s /Applications macos/image/Applications
hdiutil create -volname 海拓-1.1.12 -srcfolder macos/image -ov -format UDZO "macos/out/海拓-1.1.12-$ARCH.dmg"
hdiutil verify "macos/out/海拓-1.1.12-$ARCH.dmg"
echo "DMG created. Account login and visual tests remain required."
