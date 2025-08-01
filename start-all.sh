#!/usr/bin/env bash
#
# start-all.sh — find your LDAP server script, launch it + app.js

# Potential locations for your LDAP server entrypoint
CANDIDATES=(
  "src/ldap/server.js"
  "src/ldap/ldap-server.js"
  "src/ldap/index.js"
  "src/ldap/ldap-server/index.js"
)

LDAP_CMD=""
for path in "${CANDIDATES[@]}"; do
  if [ -f "$path" ]; then
    LDAP_CMD="node $path"
    echo "🔍 Found LDAP server at $path"
    break
  fi
done

if [ -z "$LDAP_CMD" ]; then
  echo "❌ Could not locate your LDAP server script."
  echo "   Please edit start-all.sh and set LDAP_CMD manually."
  exit 1
fi

echo "🚀 Starting LDAP service..."
eval "$LDAP_CMD" &
LDAP_PID=$!

# short pause for LDAP to bind
sleep 2

echo "🚀 Starting main app..."
node app.js &
APP_PID=$!

# on SIGINT/SIGTERM, kill both
trap "echo; echo '🛑 Shutting down all…'; kill $LDAP_PID $APP_PID; exit 0" SIGINT SIGTERM

# wait for either to exit
wait -n
echo "⚠️ One process exited; shutting down the other…"
kill $LDAP_PID $APP_PID
