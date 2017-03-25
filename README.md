## Description

HTTP REST interface for a USB to RS232 serial adapter. This is useful for controlling devices such as an Epson
projector over the network.

## Setup

1. Enable SSH and boot to CLI
1. Upgrade Firmware

       sudo rpi-update
       sudo reboot

1. Update packages

       sudo apt-get update
       sudo apt-get upgrade
       sudo apt-get autoremove
       sudo reboot

1. Turn off rsyslog xconsole output `sudo vi /etc/rsyslog.conf` comment out

       daemon.*;mail.*;\
           news.err;\
           *.=debug;*.=info;\
           *.=notice;*.=warn   |/dev/xconsole

1. Install node.js

       sudo apt-get remove nodejs
       wget https://nodejs.org/dist/v6.10.0/node-v6.10.0-linux-armv7l.tar.xz
       tar xf node-v6.10.0-linux-armv7l.tar.xz
       sudo mv node-v6.10.0-linux-armv7l /opt/node-v6.10.0-linux-armv7l
       sudo ln -s /opt/node-v6.10.0-linux-armv7l /opt/node
       sudo ln -s /opt/node/bin/node /usr/bin/node
       sudo ln -s /opt/node/bin/npm /usr/bin/npm

1. Prepare for install

       sudo mkdir /opt/node-pi-rs232
       sudo chmod a+rwx /opt/node-pi-rs232
       sudo mkdir /var/log/node-pi-rs232
       sudo chmod a+rwx /var/log/node-pi-rs232

1. Development

       rsync --links -ur --exclude node_modules * pi@192.168.0.161:/opt/node-pi-rs232
       ssh pi@192.168.0.161
       cd /opt/node-pi-rs232/
       npm install

1. Autostart, add `/opt/node-pi-rs232/run.sh > /dev/null 2>&1 &` to `/etc/rc.local`
