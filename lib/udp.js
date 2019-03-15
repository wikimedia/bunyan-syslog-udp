"use strict";

var Stream = require('stream').Stream;
var dgram = require('dgram');
var os = require('os');
var util = require('util');
var sprintf = util.format;

var HOSTNAME = os.hostname();

var bunyan = {
    FATAL: 60,
    ERROR: 50,
    WARN: 40,
    INFO: 30,
    DEBUG: 20,
    TRACE: 10,

    safeCycles: function safeCycles() {
        var seen = [];

        function bunyanCycles(k, v) {
            if (!v || typeof (v) !== 'object') {
                return (v);
            }
            if (seen.indexOf(v) !== -1) {
                return ('[Circular]');
            }
            seen.push(v);
            return (v);
        }

        return (bunyanCycles);
    }
};


// Syslog Levels
var LOG_EMERG = 0;
var LOG_ALERT = 1;
var LOG_CRIT = 2;
var LOG_ERR = 3;
var LOG_WARNING = 4;
var LOG_NOTICE = 5;
var LOG_INFO = 6;
var LOG_DEBUG = 7;


/**
 * Translates a Bunyan level into a syslog level
 */
function level(l) {
    var sysl;

    switch (l) {
        case bunyan.FATAL:
            sysl = LOG_EMERG;
            break;

        case bunyan.ERROR:
            sysl = LOG_ERR;
            break;

        case bunyan.WARN:
            sysl = LOG_WARNING;
            break;

        case bunyan.INFO:
            sysl = LOG_INFO;
            break;

        default:
            sysl = LOG_DEBUG;
            break;
    }

    return (sysl);
}


function time(t) {
    return (new Date(t).toJSON());
}

function SyslogStream(opts) {
    Stream.call(this);

    this.facility = opts.facility || 16;
    this.name = opts.name || process.title || process.argv[0];
    this.writable = true;
    this.prefix = opts.prefix || '';
    this.host = opts.host || '127.0.0.1';
    this.port = opts.port || 514;

    this.socket = dgram.createSocket('udp4');
    this.socket.on('close', this.emit.bind(this, 'close'));
    this.socket.on('error', this.emit.bind(this, 'error'));

    this._pending = 0;
}

util.inherits(SyslogStream, Stream);

SyslogStream.prototype.close = function close() {
    this.writable = false;

    if (this._pending === 0) {
        this.socket.close();
    } else {
        setTimeout(this.close.bind(this), 10);
    }
};

SyslogStream.prototype.destroy = function destroy() {
    this.writable = false;
    this.close();
};

SyslogStream.prototype.end = function end() {
    if (arguments.length > 0) {
        this.write.apply(this, Array.prototype.slice.call(arguments));
    }

    this.writable = false;
    this.close();
};

SyslogStream.prototype.write = function write(r) {
    if (!this.writable) {
        throw new Error('SyslogStream has been ended already');
    }

    var h;
    var l;
    var m;
    var t;

    if (Buffer.isBuffer(r)) {
        // expensive, but not expected
        m = r.toString('utf8');
    } else if (typeof (r) === 'object') {
        h = r.hostname;
        l = level(r.level);
        m = this.prefix + JSON.stringify(r, bunyan.safeCycles());
        t = time(r.time);
    } else if (typeof (r) === 'string') {
        m = r;
    } else {
        throw new TypeError('record (Object) required');
    }

    l = (this.facility * 8) + (l !== undefined ? l : level(bunyan.INFO));
    var hdr = sprintf('<%d>%s %s %s[%d]:', l,
        (t || time()), (h || HOSTNAME), this.name, process.pid);
    this._send(hdr + m);
};

SyslogStream.prototype._send = function _send(msg) {
    var self = this;

    var buf = new Buffer(msg, 'utf-8');
    var s = this.socket;

    this._pending++;
    s.send(buf, 0, buf.length, this.port, this.host, function(err) {
        if (err) {
            self.emit('error', err);
        }
        self._pending--;
    });
};


SyslogStream.prototype.toString = function toString() {
    var str = '[object SyslogStream<facility=' + this.facility;
    if (this.host) {
        str += ', host=' + this.host;
    }
    if (this.port) {
        str += ', port=' + this.port;
    }
    str += ', proto=udp>]';
    return str;
};

module.exports = SyslogStream;