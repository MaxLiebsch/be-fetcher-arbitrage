#!/bin/bash

# Path to the heartbeat log file
HEARTBEAT_LOG="/var/log/tasks/heartbeat.log"

# Get the current timestamp in milliseconds
timestamp=$(($(date +%s%N) / 1000000))

# Get the process ID (PID)
pid=$$

# Get the hostname
hostname=$(hostname)

# Path to package.json
PACKAGE_JSON="/app/package.json"

# Maximum allowed time since the last log update (in minutes)
MAX_TIME_DIFF=3

VERSION=$(jq -r '.version' $PACKAGE_JSON)

# Check if the log file has been updated in the last MAX_TIME_DIFF minutes
if test `find "$HEARTBEAT_LOG" -mmin +$MAX_TIME_DIFF`
then
  echo "{\"level\":30,\"time\":$timestamp,\"pid\":$pid,\"hostname\":\"$hostname\",\"msg\":\"App is unresponsive. Restarting...\"}" >> /var/log/tasks/_GLOBAL.log
  pkill -f puppeteer
  pm2 restart "scheduler_$VERSION"  # Replace "scheduler" with the name of your app in PM2
else
  echo "{\"level\":30,\"time\":$timestamp,\"pid\":$pid,\"hostname\":\"$hostname\",\"msg\":\"App is running normally.\"}" >> /var/log/tasks/_GLOBAL.log
fi