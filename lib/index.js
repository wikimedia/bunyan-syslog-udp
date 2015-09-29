"use strict";

var UDPStream = require('./udp');

var FACILITY = {
    kern: 0,
    user: 1,
    mail: 2,
    daemon: 3,
    auth: 4,
    syslog: 5,
    lpr: 6,
    news: 7,
    uucp: 8,
    authpriv: 10,
    ftp: 11,
    cron: 15,
    local0: 16,
    local1: 17,
    local2: 18,
    local3: 19,
    local4: 20,
    local5: 21,
    local6: 22,
    local7: 23
};

function convertFacility(facilityString) {
    if (!facilityString) {
        return FACILITY.local0;
    }
    var result = FACILITY[facilityString.toLowerCase()];
    if (result === undefined) {
        throw new Error('Unknown facility ' + facilityString);
    }
    return result;
}

module.exports = {
    createBunyanStream: function createBunyanStream(opts) {
        opts = opts || {};
        opts.facility = convertFacility(opts.facility);
        return new UDPStream(opts);
    }
};