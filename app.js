const _ = require('lodash');
const Xantrex = require("./lib/xantrex.js").Xantrex;
const schedule = require('node-schedule');
const SunCalc = require('suncalc');
const isBefore = require('date-fns/is_before');
const isAfter = require('date-fns/is_after');
const isSameDay = require('date-fns/is_same_day');
const formatDate = require('date-fns/format');
// Load the AWS SDK for Node.js
let AWS = require('aws-sdk');

// Set the region
AWS.config.update({region: process.env.AWS_REGION});
AWS.config.loadFromPath('./config.json');

let dynamoClient = new AWS.DynamoDB.DocumentClient();


let times = {};
let lastReading = {
  date: new Date()
};

function log(message) {
  const now = new Date();
  console.log(formatDate(now) + ': ' + message);
}

/**
 * Load sunrise and sunset times
 */
function updateTimes() {
  let now = new Date();
  times = _.extend(SunCalc.getTimes(now, -37, 144), {timestamp: now});
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
            if (!isSameDay(now, lastReading.date) &&
              parseFloat(result.kwhtoday) > 0.5) {
              log('Skipping yesterday\'s reading');
            } else {
              let data = {
                'device_id': 'XANTREX0001',
                timestamp: formatDate(now),
                reading: result
              };
              setLastReading(result);
              console.log('Sending reading');
              dynamoClient.put(
                {
                  TableName: "sensors",
                  Item: data
                },
                function (err, data) {
                });
            }
            xantrex.disconnect();
          });
      }).fail(function (error) {
      log('Error:'.JSON.stringify(error));
      xantrex.disconnect();
    });
  }
}

/**
 * init
 */
updateTimes();

const updateTimesSchedule = schedule.scheduleJob('updateTimes', '0 * * * *', updateTimes);
const j = schedule.scheduleJob('performReading', '* * * * *', () => {
  performReading(lastReading, times);
});
