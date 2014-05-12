var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var Q = require("q");
var _ = require("lodash");
var commands = {
  'kwhlife' : 'KWHLIFE?',
  'kwhtoday' : 'KWHTODAY?',
  'kwhsummary' : 'MEASENGY?',
  'inputsummary' : 'MEASIN?',
  'outputsummary' : 'MEASOUT?',
  'temperature' : 'MEASTEMP?'
}


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
xantrex._mapOutput = function(output, map) {
 var parts = output.split(" ");
 var result = {};
 _.each(map,function(val, index) {
  result[val] = parts[index].split(":")[1];
 });
 return result;
}; 


xantrex.runCommand = function(cmd) {
  var self = this;
  var deferred = Q.defer();
  this.connection.write(commands[cmd] + "\r", function(err,result) {
    self.callbuffer.push(deferred);
   });
  return deferred.promise;
}

xantrex.getKwhToday = function() {
  return this.runCommand('kwhtoday');
};

xantrex.getKwhLife = function() {
  return this.runCommand('kwhlife');
};

xantrex.getKwhSummary = function() {
  var self = this;
  return this.runCommand('kwhsummary').then(
      function(result) {
        return self._mapOutput(result, ['wout', 'kwhtoday', 'kwhlife']); 
      });
};

xantrex.getTemperature = function() {
  var self = this;
  return this.runCommand('temperature').then(
    function(result) {
      return self._mapOutput(result, ['ctemp', 'ftemp']); 
    });
};

module.exports =  {
  Xantrex: Xantrex
};



