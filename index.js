var nconf = require('nconf');
var Firebase = require('firebase');

nconf.argv().env().file({ file: 'config.json' });
function getConfig(option) {
    return process.env[String(option)] || nconf.get(String(option));
}
var ref = new Firebase(`https://${getConfig('FIREBASE_URL')}.firebaseio.com/`);

var lolRegion = getConfig('LOL_REGION');
var lolToken = getConfig('LOL_TOKEN');
var lolapi = require('lolapi')(lolToken, lolRegion);
// setRateLimit(limitPer10s, limitPer10min)
lolapi.setRateLimit(10, 500);

// first beginDate = 1427866500;
// get lastTimestamp from firebase
var p1 = new Promise(
function(resolve) {
  ref.child('lastTimestamp').on('value', function(snapshot) {
    resolve(snapshot.val());
  }, function(errorObject) {
    console.log(`The read failed: ${errorObject.code}`);
  });
});

function fetchURFMatches(timestamp) {
    lolapi.ApiChallenge.get(timestamp, function(error, result) {
        console.log(timestamp);
        if (error) {
            console.log('Error: ', error);
        } else {
            console.log(`${result.length} Games played`);

            // save list of match IDs to the timestamp given
            var resultObject = {};
            resultObject[timestamp] = result;
            ref.update(resultObject);

            // save last updated timestamp
            ref.update({
                lastTimestamp: timestamp
            });

            // If the timestamp + 5 minutes is less than the current time,
            // then re run.
            if (timestamp + 300 < (Date.now() / 1000)) {
                cron(timestamp);
            } else {
                // check fresh data every 10 minutes
                cron(timestamp, 600000)
            }
        }
    });
}

function cron(timestamp, interval) {
    // go to the next 5 minutes
    var nextTimestamp = timestamp + 300;
    setTimeout(function() {
        fetchURFMatches(nextTimestamp);
    }, interval || 2000);
}

p1.then(function(timestamp) {
    cron(timestamp);
});
