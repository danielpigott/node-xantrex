const _ = require('lodash');
const Xantrex = require("./lib/xantrex.js").Xantrex;
const schedule = require('node-schedule');
const SunCalc = require('suncalc');
const axios = require('axios');
const isBefore = require('date-fns/is_before');
const isAfter = require('date-fns/is_after');
const isSameDay = require('date-fns/is_same_day');
const differenceInSeconds = require('date-fns/difference_in_seconds')
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
 * Load sunrise and sunset times
 */
function updateTimes() {
  let now = new Date();
  times = _.extend(SunCalc.getTimes(now, -37, 144), {timestamp:now});
  log('Updating times');
}

function setLastReading(reading) {
  let now = new Date();
  _.extend(
      lastReading,
      {
	date: now,
	reading: reading
      });

}

/**
 * Read from the inverter
 */
function performReading(lastReading, times) {
  let now = new Date();
  log(differenceInSeconds(now, times.sunset));
  log('last updated: ' + formatDate(times.timestamp));
  log('now: ' + formatDate(now));
  log('sunset: ' + formatDate(times.sunset));
  log('last reading time: ' + formatDate(lastReading.date));
  if (isAfter(now, times.sunset)) {
    log('Sun has set');
  } else if (isBefore(now, times.sunrise)) {
    log('Before sunrise');
  } else {
    log('Getting reading');
    let xantrex = new Xantrex("/dev/ttyUSB0", 9600);
    xantrex.connect().then(
      function () {
        xantrex.getSummary().then(
          function (result) {
            log('Reading:' + JSON.stringify(result));
            if (!isSameDay(now, lastReading.date) && 
		    parseFloat(result.kwhtoday) > 0.5) {
                log('Skipping yesterday\'s reading');
            } else {
              let data = {
		      timestamp: formatDate(now),
		      reading: result
	      };
              setLastReading(result);
		    console.log('Sending: ' + JSON.stringify(data));
	      api.post(
                '/sensors-xantrex/reading/',
                data 
              );
            }
	    xantrex.disconnect();
          });
      }).fail(function (error) {
	      log('Error:' . JSON.stringify(error));
	      xantrex.disconnect();
    });
  }
}

/**
 * init
 */
updateTimes();

const updateTimesSchedule = schedule.scheduleJob('updateTimes', '0 * * * *', updateTimes);
const j = schedule.scheduleJob('performReading', '* * * * *', () => { performReading(lastReading, times);});
