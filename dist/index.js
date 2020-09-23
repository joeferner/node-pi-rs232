"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var serialport_1 = __importDefault(require("serialport"));
var bunyan_1 = __importDefault(require("bunyan"));
var Readline = require('@serialport/parser-readline');
var port = process.env.PORT || 8080;
var serialDev = process.env.SERIAL_DEV;
var serialPortOpenOptions = {
    baudRate: parseInt(process.env.BAUD_RATE || '9600'),
    dataBits: parseInt(process.env.DATA_BITS || '8'),
    stopBits: parseInt(process.env.STOP_BITS || '1'),
    parity: (process.env.PARITY || 'none')
};
var LOGGER = createLogger();
var receiveQueue = [];
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var port, serialPort;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, findSerialPort()];
                case 1:
                    port = _a.sent();
                    return [4 /*yield*/, openSerialPort(port)];
                case 2:
                    serialPort = _a.sent();
                    return [2 /*return*/, startWebServer(serialPort)];
            }
        });
    });
}
function writeToSerialPort(serialPort, value, options) {
    LOGGER.info("writing to serial port: " + value);
    return new Promise(function (resolve, reject) {
        var beforeSendReceiveQueueSize = receiveQueue.length;
        serialPort.write(Buffer.from(value + '\r'));
        if (!options.waitForResponse) {
            return resolve();
        }
        var timeout;
        if (options.timeout) {
            LOGGER.debug("setting timeout to " + options.timeout + "ms");
            setTimeout(function () {
                clearInterval(interval);
                reject(new Error("Timeout " + options.timeout + "ms waiting for response"));
            }, options.timeout);
        }
        var interval = setInterval(function () {
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
    return new Promise(function (resolve) {
        var app = express_1.default();
        app.use(body_parser_1.default.json());
        app.post('/send', function (req, res, next) {
            var value = req.body.value;
            var waitForResponse = req.body.waitForResponse;
            var timeout = req.body.timeout;
            if (!value) {
                return res.status(400).send('"value" is required');
            }
            writeToSerialPort(serialPort, value, { waitForResponse: waitForResponse, timeout: timeout })
                .then(function () {
                var response = JSON.stringify(receiveQueue);
                receiveQueue.length = 0;
                res.send(response);
            })
                .catch(function (err) {
                LOGGER.error("failed to send " + value, err);
                return next(err);
            });
        });
        app.use(express_1.default.static('public'));
        app.listen(port, function () {
            LOGGER.info("Listening on http://localhost:" + port);
            resolve();
        });
    });
}
function findSerialPort() {
    return __awaiter(this, void 0, void 0, function () {
        var ports, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, serialport_1.default.list()];
                case 1:
                    ports = _a.sent();
                    if (serialDev) {
                        LOGGER.debug("finding serial port " + serialDev);
                        for (i = 0; i < ports.length; i++) {
                            if (ports[i].path === serialDev) {
                                return [2 /*return*/, ports[i]];
                            }
                        }
                        throw new Error("Could not find serial port: " + serialDev);
                    }
                    if (ports.length === 0) {
                        throw new Error('Could not find valid serial ports');
                    }
                    LOGGER.debug("SERIAL_DEV not specified. using first found port");
                    return [2 /*return*/, ports[0]];
            }
        });
    });
}
function openSerialPort(portInfo) {
    return new Promise(function (resolve) {
        LOGGER.info("opening serial port " + portInfo.path);
        var serialPort = new serialport_1.default(portInfo.path, serialPortOpenOptions);
        var parser = serialPort.pipe(new Readline({ delimiter: '\r' }));
        serialPort.on('open', function () {
            LOGGER.info('port opened');
            resolve(serialPort);
        });
        parser.on('data', function (line) {
            LOGGER.info("recv: " + line);
            receiveQueue.push(line);
        });
    });
}
function createLogger() {
    var _a, _b;
    var options = {
        name: 'node-pi-rs232',
        level: 'debug',
        streams: [
            {
                stream: process.stdout
            }
        ]
    };
    if (process.env.LOG_FILE) {
        (_a = options.streams) === null || _a === void 0 ? void 0 : _a.push({
            type: 'file',
            path: process.env.LOG_FILE
        });
    }
    if (process.env.LOGSTASH_HOST) {
        (_b = options.streams) === null || _b === void 0 ? void 0 : _b.push({
            type: "raw",
            stream: require('bunyan-logstash').createStream({
                host: process.env.LOGSTASH_HOST,
                port: process.env.LOGSTASH_PORT || 5505
            })
        });
    }
    return bunyan_1.default.createLogger(options);
}
run()
    .then(function () {
    LOGGER.info('started');
})
    .catch(function (err) {
    if (err) {
        LOGGER.error('could not start', err);
        return process.exit(-1);
    }
});
//# sourceMappingURL=index.js.map