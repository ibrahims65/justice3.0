#!/usr/bin/env bash
# start-all.sh — launches LDAP + main app, then waits for them

# — Customize these if your commands differ
LDAP_CMD="node src/ldap/server.js"
APP_CMD="node app.js"

echo "🚀 Starting LDAP service..."
# run in background, capture PID
eval $LDAP_CMD &
LDAP_PID=$!

# small pause so LDAP can bind ports before app boots
sleep 2

echo "🚀 Starting main app..."
eval $APP_CMD &
APP_PID=$!

# on CTRL+C, kill both children
trap "echo; echo '🛑 Shutting down...'; kill $LDAP_PID $APP_PID; exit 0" SIGINT SIGTERM

# wait for either to exit
wait -n

echo "⚠️ One process exited. Killing the other..."
kill $LDAP_PID $APP_PID
exit 0
