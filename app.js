const Xantrex = require("./lib/xantrex.js").Xantrex;
const schedule = require('node-schedule');
const SunCalc = require('suncalc');
const axios = require('axios');
const isBefore = require('date-fns/is_before');
const isAfter = require('date-fns/is_after');
const isSameDay = require('date-fns/is_same_day');
let times = {};
let lastReading = {
  date: new Date()
};

const api = axios.create({
  baseURL: process.env.XANTREX_STORE_URL,
  timeout: 1000,
});
/**
 * Get sunrise and sunset times
 */
function updateTimes() {
  times = SunCalc.getTimes(new Date(), -37, 144);
  console.log('Updating times');
}

/**
 * Read from the inverter
 */
function performReading() {
  let now = new Date();
  if (isAfter(now, times.sunset)) {
    console.log('Sun has set');
  }
  else if (isBefore(now, times.sunrise)) {
    console.log('Before sunrise');
  } else {

    console.log('Getting reading');
    let xantrex = new Xantrex("/dev/ttyUSB0", 9600);
    xantrex.connect().then(
      function () {
        xantrex.getSummary().then(
          function (result) {
            console.log(result);
            if (!isSameDay(now, lastReading.date)) {
              if (result.kwhtoday > 0.5) {
                console.log('Skipping yesterday\'s reading');
              }
            } else {
              lastReading = {
                date: new Date(),
                reading: result
              };
              api.post('/sensors-xantrex/reading/', result);
              xantrex.disconnect();
            }
          });
      }).catch(function (error) {
      console.log(error);
    });
  }
}

/**
 * init
 */
updateTimes();
performReading();

const updateTimesSchedule = schedule.scheduleJob('0 0 * * *', updateTimes);

const j = schedule.scheduleJob('* * * * *', performReading);
