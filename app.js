const _ = require('lodash');
const Xantrex = require("./lib/xantrex.js").Xantrex;
const schedule = require('node-schedule');
const SunCalc = require('suncalc');
const axios = require('axios');
const isBefore = require('date-fns/is_before');
const isAfter = require('date-fns/is_after');
const isSameDay = require('date-fns/is_same_day');
const formatDate = require('date-fns/format');
let times = {};
let lastReading = {
  date: new Date()
};

const api = axios.create({
  baseURL: process.env.XANTREX_STORE_URL,
  timeout: 1000,
});

function log(message) {
  const now = new Date();
  console.log(formatDate(now) + ': ' + message);
}

/**
 * Get sunrise and sunset times
 */
function updateTimes() {
  times = SunCalc.getTimes(new Date(), -37, 144);
  log('Updating times');
}

/**
 * Read from the inverter
 */
function performReading() {
  let now = new Date();
  if (isAfter(now, times.sunset)) {
    log('Sun has set');
  }
  else if (isBefore(now, times.sunrise)) {
    log('Before sunrise');
  } else {
    log('Getting reading');
    let xantrex = new Xantrex("/dev/ttyUSB0", 9600);
    xantrex.connect().then(
      function () {
        xantrex.getSummary().then(
          function (result) {
            log(result);
            if (!isSameDay(now, lastReading.date)) {
		    log(lastReading);
              if (result.kwhtoday > 0.5) {
                log('Skipping yesterday\'s reading');
              }
            } else {
              lastReading = {
                date: now,
                reading: result
              };
              api.post(
                '/sensors-xantrex/reading/',
                _.extend(result, {timestamp: formatDate(now)})
              );
            }
	    xantrex.disconnect();
          });
      }).catch(function (error) {
      log(error);
    });
  }
}

/**
 * init
 */
updateTimes();
performReading();

const updateTimesSchedule = schedule.scheduleJob('updateTimes', '0 0 * * *', updateTimes);

const j = schedule.scheduleJob('performReading', '* * * * *', performReading);
