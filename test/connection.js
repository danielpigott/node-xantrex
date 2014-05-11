var Xantrex = require("../lib/xantrex.js").Xantrex;

var xantrex = new Xantrex("/dev/ttyUSB0", 9600);
xantrex.connect();
setTimeout(function() {
  xantrex.getKwhToday();
  setTimeout(function() {xantrex.disconnect();}, 2000);
},2000);


