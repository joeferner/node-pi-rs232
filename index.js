const express = require('express');
const bodyParser = require('body-parser');
const SerialPort = require('serialport');
const bunyan = require('bunyan');
const Readline = require('@serialport/parser-readline');

const port = process.env.PORT || 8080;
const serialDev = process.env.SERIAL_DEV;
const serialPortOpenOptions = {
  baudRate: parseInt(process.env.BAUD_RATE || 9600),
  dataBits: parseInt(process.env.DATA_BITS || 8),
  stopBits: parseInt(process.env.STOP_BITS || 1),
  parity: process.env.PARITY || 'none'
};
const LOGGER = createLogger();
const receiveQueue = [];

function run() {
  return findSerialPort()
    .then(port => {
      return openSerialPort(port);
    })
    .then((serialPort) => {
      return startWebServer(serialPort);
    });
}

function writeToSerialPort(serialPort, value, options) {
  LOGGER.info(`writing to serial port: ${value}`);
  return new Promise((resolve, reject) => {
    const beforeSendReceiveQueueSize = receiveQueue.length;
    serialPort.write(Buffer.from(value + '\r'));
    if (!options.waitForResponse) {
      return resolve();
    }
    let timeout;
    if (options.timeout) {
      LOGGER.debug(`setting timeout to ${options.timeout}ms`);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error(`Timeout ${options.timeout}ms waiting for response`));
      }, options.timeout);
    }
    const interval = setInterval(() => {
      if (receiveQueue.length !== beforeSendReceiveQueueSize) {
        clearInterval(interval);
        if (timeout) {
          clearTimeout(timeout);
        }
        resolve();
      }
    }, 10);
  });
}

function startWebServer(serialPort) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(bodyParser.json());

    app.post('/send', (req, res, next) => {
      const value = req.body.value;
      const waitForResponse = req.body.waitForResponse;
      const timeout = req.body.timeout;
      if (!value) {
        return res.status(400).send('"value" is required');
      }
      writeToSerialPort(serialPort, value, {waitForResponse, timeout})
        .then(() => {
          const response = JSON.stringify(receiveQueue);
          receiveQueue.length = 0;
          res.send(response);
        })
        .catch(err => {
          LOGGER.error(`failed to send ${value}`, err);
          return next(err);
        });
    });

    app.use(express.static('public'));

    app.listen(port, function () {
      LOGGER.info(`Listening on http://localhost:${port}`);
      resolve();
    });
  });
}

function findSerialPort() {
  return new Promise((resolve, reject) => {
    SerialPort.list(function (err, ports) {
      if (err) {
        return reject(err);
      }
      if (serialDev) {
        LOGGER.debug(`finding serial port ${serialDev}`);
        for (let i = 0; i < ports.length; i++) {
          if (ports[i].comName === serialDev) {
            return resolve(ports[i]);
          }
        }
        return reject(new Error(`Could not find serial port: ${serialDev}`));
      }
      if (ports.length === 0) {
        return reject(new Error('Could not find valid serial ports'));
      }
      LOGGER.debug(`SERIAL_DEV not specified. using first found port`);
      return resolve(ports[0]);
    });
  });
}

function openSerialPort(portInfo) {
  return new Promise((resolve, reject) => {
    LOGGER.info(`opening serial port ${portInfo.comName}`);
    const serialPort = new SerialPort(portInfo.comName, serialPortOpenOptions);
    const parser = serialPort.pipe(new Readline({delimiter: '\r'}));
    serialPort.on('open', () => {
      LOGGER.info('port opened');
      resolve(serialPort);
    });
    parser.on('data', (line) => {
      LOGGER.info(`recv: ${line}`);
      receiveQueue.push(line);
    });
  });
}

function createLogger() {
  let options = {
    name: 'node-pi-rs232',
    level: 'debug',
    streams: [
      {
        stream: process.stdout
      }
    ]
  };
  if (process.env.LOG_FILE) {
    options.streams.push({
      type: 'file',
      path: process.env.LOG_FILE
    });
  }
  if (process.env.LOGSTASH_HOST) {
    options.streams.push({
      type: "raw",
      stream: require('bunyan-logstash').createStream({
        host: process.env.LOGSTASH_HOST,
        port: process.env.LOGSTASH_PORT || 5505
      })
    });
  }
  return bunyan.createLogger(options);
}

run()
  .then(() => {
    LOGGER.info('started');
  })
  .catch(err => {
    if (err) {
      LOGGER.error('could not start', err);
      return process.exit(-1);
    }
  });
