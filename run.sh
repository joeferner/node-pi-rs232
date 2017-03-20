#!/bin/bash

export NODE_ENV=production

cd /opt/node-pi-rs232
echo "running" > /var/log/node-pi-rs232/node-pi-rs232.log
/usr/bin/node index.js | ./node_modules/.bin/bunyan
echo "finished $?" >> /var/log/node-pi-rs232/node-pi-rs232.log
