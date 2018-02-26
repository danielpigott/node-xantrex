"use strict";
var SerialPort = require("serialport");
var Readline = SerialPort.parsers.Readline;
var Q = require("q");
var _ = require("lodash");
var commands = {
  'kwhlife': 'KWHLIFE?',
  'kwhtoday': 'KWHTODAY?',
  'kwhsummary': 'MEASENGY?',
  'inputsummary': 'MEASIN?',
  'outputsummary': 'MEASOUT?',
  'temperature': 'MEASTEMP?'
};

/**
 *
 * @param port
 * @param rate
 * @constructor
 */
function Xantrex(port, rate) {
  this.port = port;
  this.rate = rate;
  this.connection = new SerialPort(
    this.port,
    {
      baudRate: this.rate,
      parser: new Readline({ delimiter: '\r'}),
      autoOpen: false
    }
  );
}

var xantrex = Xantrex.prototype;
xantrex.connection = false;
xantrex.connectionState = false;
xantrex.sending = false;
xantrex.callbuffer = [];
xantrex.connect = function () {
  var self = this;
  var deferred = Q.defer();
  this.connection.open(function () {
    self.connection.on("data", function (data) {
      var deferred = self.callbuffer.shift();
      deferred.resolve(data);
    });
    deferred.resolve(true);
  });
  return deferred.promise;
};

/**
 * Disconnect port
 */
xantrex.disconnect = function () {
  this.connection.close(function () {
  });
};

/**
 * Map output of inverter to an object
 * @param output
 * @param map
 * @returns {{}}
 * @private
 */
xantrex._mapOutput = function (output, map) {
  var parts = output.split(" ");
  var result = {};
  _.each(map, function (val, index) {
    result[val] = parseFloat(parts[index].split(":")[1].replace('\r',''));
  });
  return result;
};

/**
 *
 * @param cmd
 * @returns {*}
 */
xantrex.runCommand = function (cmd) {
  var self = this;
  var deferred = Q.defer();
  Q.delay(4000).then(function () {
    if (deferred.promise.isPending()) {
      self.callbuffer.shift();
      deferred.reject(new Error("Timed out"));
    }
  });
  var bufferlength = self.callbuffer.length;
  var delay = (bufferlength > 0) ? bufferlength * 500 : 0;
  self.callbuffer.push(deferred);
  Q.delay(delay).then(function () {
    self.connection.write(commands[cmd] + "\r", function (err, result) {
      return result.toString();
    });
  });
  return deferred.promise;
};

/**
 *
 * @returns {*}
 */
xantrex.getKwhToday = function () {
  return this.runCommand('kwhtoday');
};

/**
 *
 * @returns {*}
 */
xantrex.getKwhLife = function () {
  return this.runCommand('kwhlife');
};

/**
 *
 */
xantrex.getKwhSummary = function () {
  var self = this;
  return this.runCommand('kwhsummary').then(
    function (result) {
      return self._mapOutput(result, ['pout', 'kwhtoday', 'kwhlife']);
    });
};

/**
 *
 */
xantrex.getTemperature = function () {
  var self = this;
  return this.runCommand('temperature').then(
    function (result) {
      return self._mapOutput(result, ['ctemp', 'ftemp']);
    });
};

/**
 *
 */
xantrex.getInputSummary = function () {
  var self = this;
  return this.runCommand('inputsummary').then(
    function (result) {
      return self._mapOutput(result, ['vin', 'lin', 'pin']);
    });
};

/**
 *
 */
xantrex.getOutputSummary = function () {
  var self = this;
  return this.runCommand('outputsummary').then(
    function (result) {
      return self._mapOutput(result, ['vout', 'lout', 'pout']);
    });
};

/**
 * Get summary of current readings
 */
xantrex.getSummary = function () {
  var promises = [
    this.getKwhSummary(),
    this.getTemperature(),
    this.getInputSummary(),
    this.getOutputSummary()
  ];
  return Q.allSettled(promises)
    .then(function (results) {
      var obj = {};
      _.each(results, function (result) {
        if (result.state === "fulfilled") {
          obj = _.merge(obj, result.value);
        } else {
          console.log(result.reason);
        }

      });
      return obj;
    });
};


module.exports = {
  Xantrex: Xantrex
};



