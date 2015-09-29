# node-bunyan-syslog-udp [![Build Status](https://travis-ci.org/wikimedia/node-bunyan-syslog-udp.svg?branch=master)](https://travis-ci.org/wikimedia/node-bunyan-syslog-udp)
A pure-JS implementation of bynuan syslog stream on top of UDP protocol.

Usage:

```javascript
var bsyslog = require('node-bunyan-syslog-udp');
var log = bunyan.createLogger({
  streams: [{
    type: 'raw', // Always use 'raw' bunyan stream
    level: 'trace',
    stream: bsyslog.createBunyanStream({
      name: 'udptest',   // Optional. Defaults to process.title || process.argv[0]
      host: '127.0.0.1', // Optional. Defaults to '127.0.0.1'
      port: 514,         // Optional. Defaults to 514
      facility: 'local0' // Case-insensitive. Optional. Defaults to local0
    });
  }]
});
```
