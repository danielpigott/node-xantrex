let reading = require('./reading');
const formatDate = require('date-fns/format');

let AWS = require('aws-sdk');

// Set the region
AWS.config.update({region: 'ap-southeast-2'});
AWS.config.loadFromPath('../config.json');
let dynamoClient = new AWS.DynamoDB.DocumentClient();

let now = new Date();
let data = {
  'device_id': 'TEST0001',
  timestamp: formatDate(now),
  reading: reading
};

console.log('Sending: ' + JSON.stringify(data));
dynamoClient.put(
  {
    TableName: 'sensors',
    Item: data
  },
  function (err, data) {
    console.log(err)
  });
