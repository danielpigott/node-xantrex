var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var Q = require("q");
var _ = require("lodash");

function Xantrex(port, rate) {
  this.port = port;
  this.rate = rate;
  this.connection = new SerialPort(
    this.port,
    {
      baudrate: this.rate, 
      parser: serialport.parsers.readline("\r")
    },
    false
    );
}

var xantrex = Xantrex.prototype;

xantrex.connection = false;
xantrex.connectionState = false;
xantrex.callbuffer = [];
xantrex.connect = function() {
  var self = this;
  var deferred = Q.defer();
  this.connection.open(function() {
    self.connection.on("data", function(data) {
      var deferred = self.callbuffer.pop();
      deferred.resolve(data);
    });
    deferred.resolve(true);
  });
  return deferred.promise;
}

xantrex.disconnect = function() {
  this.connection.close(function() {
    console.log("Disconnected");
  });
}

xantrex.getKwhToday = function() {
  var self = this;
  var deferred = Q.defer();
  this.connection.write("KWHTODAY?\r", function(err,result) {
    self.callbuffer.push(deferred);
   });
  return deferred.promise;
};

module.exports =  {
  Xantrex: Xantrex
};



