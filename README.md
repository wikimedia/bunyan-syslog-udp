# bunyan-syslog-udp [![Build Status](https://travis-ci.org/wikimedia/bunyan-syslog-udp.svg?branch=master)](https://travis-ci.org/wikimedia/bunyan-syslog-udp)
A pure-JS implementation of bunyan syslog stream on top of UDP protocol.

## Installation

```bash
npm install bunyan bunyan-syslog-udp
```

Verify that syslog via UDP is enabled on your system. By default, the syslog daemon listens on port 514.

In order to take advantage of the @CEE cookie functionality either `rsyslog` or `syslog-ng` must be installed.

For rsyslog, make sure the mmjsonparse module is loaded in `/etc/rsyslog.conf`

```bash
module(load="mmjsonparse") # for parsing CEE-enhanced syslog messages
```

## Usage

```javascript
var bunyan = require('bunyan');
var bsyslog = require('bunyan-syslog-udp');

var bstream = bsyslog.createBunyanStream({
      name: 'udptest',      // Optional. Defaults to process.title || process.argv[0]
      host: '127.0.0.1',    // Optional. Defaults to '127.0.0.1'
      port: 514,            // Optional. Defaults to 514
      facility: 'local0',   // Case-insensitive. Optional. Defaults to local0
      prefix: '@cee: '      // Add @cee cookie to message
    });

var log = bunyan.createLogger({
  streams: [{
    type: 'raw',    // Always use 'raw' bunyan stream
    level: 'trace', // Minimum log level
    stream: bstream
  }]
});

// Emit a log message
log.debug("This is a test");

// and close the socket
bstream.close();
```
