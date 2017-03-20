const express = require('express');
const bodyParser = require('body-parser');
const SerialPort = require('serialport');
const bunyan = require('bunyan');

const port = process.env.PORT || 8080;
const LOGGER = createLogger();

const app = express();
app.use(bodyParser.json());

app.post('/send', function(req, res) {
    const value = req.body.value;
    if (!body) {
        return res.status(400).send('"value" is required');
    }
    res.send('OK');
});

app.use(express.static('public'));

app.listen(port, function() {
    console.log(`Listening on http://localhost:${port}`)
});

SerialPort.list(function (err, ports) {
    ports.forEach(function(port) {
        console.log(port);
    });
});

function createLogger() {
    return bunyan.createLogger({
        name: 'node-pi-rs232',
        level: 'debug',
        streams: [
            {
                stream: process.stdout
            },
            {
                type: 'file',
                path: '/var/log/node-pi-rs232/node-pi-rs232.log'
            }
        ]
    });
}
