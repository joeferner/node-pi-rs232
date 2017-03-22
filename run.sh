#!/bin/bash

export NODE_ENV=production
export SERIAL_DEV=/dev/ttyUSB0
export PORT=8080
export BAUD_RATE=9600

cd /opt/node-pi-rs232
echo "running" > /var/log/node-pi-rs232/node-pi-rs232.log
./node_modules/.bin/forever --minUptime 1000 --spinSleepTime 10000 index.js | ./node_modules/.bin/bunyan
echo "finished $?" >> /var/log/node-pi-rs232/node-pi-rs232.log
