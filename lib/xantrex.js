var serialPort = require("serialport");
var _ = require("lodash");

exports.Xantrex = {
    connection : false,
    connectionState = false,
    connect : function() {
      this.connection = new SerialPort("/dev/tty-usbserial1", {
      baudrate: 57600
      });
      connection.on("open", function() {
          this.connectionState = true;
      });
    }
});



