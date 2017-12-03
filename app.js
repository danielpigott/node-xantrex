var Xantrex = require("./lib/xantrex.js").Xantrex;
var schedule = require('node-schedule');
var SunCalc = require('suncalc');
var axios = require('axios');
const isBefore = require('date-fns/is_before');
const isAfter = require('date-fns/is_after')
let times ={};

/**
 * Get sunrise and sunset times
 */
function updateTimes() {
  times = SunCalc.getTimes(new Date(), -37, 144);
  console.log('Updating times');
  console.log(times);
}

/**
 * Read from the inverter
 */
function performReading() {
  let now = new Date();
  if (isAfter(now, times.sunset)) {
    console.log('Sun has set');
  }
  else if(isBefore(now, times.sunrise)) {
    console.log('Before sunrise');
  } else {
    console.log('Getting reading');
    let xantrex = new Xantrex("/dev/ttyUSB0", 9600);
    xantrex.connect().then(
      function(connected) {
        xantrex.getSummary().then(
          function(kwh) {
            console.log(kwh);
            xantrex.disconnect();
          });
      });

  }
}

/**
 * init
 */
updateTimes();
performReading();

const updateTimesSchedule = schedule.scheduleJob('0 0 * * *', updateTimes);

var j = schedule.scheduleJob('* * * * *', performReading);
