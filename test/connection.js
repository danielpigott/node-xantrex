var Xantrex = require("../lib/xantrex.js").Xantrex;

var xantrex = new Xantrex("/dev/ttyUSB0", 9600);
xantrex.connect().then(
function() {
  xantrex.getKwhToday().then(
  function(kwh) {
    console.log(kwh);
    xantrex.disconnect();});
});


