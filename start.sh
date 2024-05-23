#! /bin/sh

exec dumb-init -- pm2-runtime start scheduler.pm2.config.cjs