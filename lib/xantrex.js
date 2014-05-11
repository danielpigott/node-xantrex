var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var _ = require("lodash");

function Xantrex(port, rate) {
    this.port = port;
    this.rate = rate;
}

var xantrex = Xantrex.prototype;

xantrex.connection = false;
xantrex.connectionState = false;
xantrex.buffer = [];
xantrex.connect = function() {
  this.connection = new SerialPort(
    this.port, {
      baudrate: this.rate, 
        parser: serialport.parsers.readline("\r")
    }
  );
  this.connection.on("open", function() {
    this.connectionState = true;
	  console.log("Connected");
          
  });
  this.connection.on("data", function(data) {
    console.log(data);
  });
}

xantrex.disconnect = function() {
  this.connection.close(function() {
    console.log("Disconnected");
  });
}

xantrex.getKwhToday = function() {
    var self = this;
    this.connection.write("KWHTODAY?\r", function() {
      self.connection.drain(function() {
        self.connection.flush(function(){});
      });
     });
};
                   
     

module.exports =  {
  Xantrex: Xantrex
};



