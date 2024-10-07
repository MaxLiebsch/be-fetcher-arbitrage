#!/bin/sh

# Start cron service with heartbeat check in the background
crontab /etc/cron.d/app-cron
cron

# Start pm2-runtime with scheduler configuration
exec dumb-init -- pm2-runtime start scheduler.pm2.config.cjs
