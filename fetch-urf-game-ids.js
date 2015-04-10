module.exports = function(options) {
    const firebaseUrl = options.firebaseUrl;
    const Firebase = options.firebase;
    const lolapi = options.lolapi;

    const ref = new Firebase(`https://${firebaseUrl}.firebaseio.com/`);

    // get lastTimestamp from firebase (first urf match is 1427866500)
    const p1 = new Promise(
    function(resolve) {
      ref.child('lastTimestamp').on('value', function(snapshot) {
        resolve(snapshot.val());
      }, function(errorObject) {
        console.log(`The read failed: ${errorObject.code}`);
      });
    });

    const longInterval = 600000;

    function fetchURFMatches(timestamp) {
        lolapi.ApiChallenge.get(timestamp, function(error, result) {
            console.log(timestamp);
            if (error) {
                console.log('Error: ', error);
                console.log('Already got the latest game IDs, will check every 10 minutes');
                // try again
                cron(timestamp, longInterval);
            } else {
                console.log(`${result.length} Games played`);

                // save list of match IDs to the timestamp given
                let resultObject = {};
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
                    cron(timestamp, longInterval)
                }
            }
        });
    }

    function cron(timestamp, interval) {
        // go to the next 5 minutes
        var nextTimestamp = timestamp + 300;
        setTimeout(function() {
            fetchURFMatches(nextTimestamp);
        }, interval || 2500);
    }

    p1.then(function(timestamp) {
        cron(timestamp);
    });
}
