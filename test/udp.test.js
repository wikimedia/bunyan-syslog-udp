var bunyan = require('bunyan');
var bsyslog = require('../lib');
var assert = require('assert');
var dgram = require('dgram');

function createLogSamples(prefix = '') {
    var severityList = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    var expectedSeverity = [135, 135, 134, 132, 131, 128];
    for (var i = 0; i < severityList.length; i++) {
        (function(i) {
            var severity = severityList[i];
            it('should send ' + severity + ' message', function(done) {
                var stream = bsyslog.createBunyanStream({
                    host: '127.0.0.1',
                    port: 12340 + i,
                    facility: 'local0',
                    prefix: prefix
                });
                var log = bunyan.createLogger({
                    name: 'udptest',
                    streams: [{
                        type: 'raw',
                        level: 'trace',
                        stream: stream
                    }]
                });
                var server = dgram.createSocket('udp4');
                var dispose = function() {
                    server.close();
                    stream.close();
                };
                var closeTimeout = setTimeout(dispose, 500);
                server.on("message", function(msg) {
                    msg = msg.toString();
                    var severityCode = /^<([0-9]+)>/.exec(msg);
                    if (!severityCode) {
                        throw new Error('No severity code in datagram ' + msg);
                    }
                    assert.deepEqual(severityCode[1], '' + expectedSeverity[i]);
                    var payload = (prefix === '' ? /:(\{.+})$/ : /@cee:\s*(\{.+})$/).exec(msg);
                    if (!payload) {
                        throw new Error('No payload found in datagram ' + msg);
                    }
                    payload = JSON.parse(payload[1]);
                    assert.deepEqual(payload.msg, 'sample ' + severity + ' record');
                    server.close();
                    clearTimeout(closeTimeout);
                    done();
                });
                server.bind(12340 + i);
                log[severity]({i: i}, 'sample %s record', severity);
            });
        })(i);
    }
}

describe('Sample logging', function() {
    this.timeout(1000);
    createLogSamples();
});

describe('Sample @CEE logging', function() {
    this.timeout(1000);
    createLogSamples('@cee:');
});