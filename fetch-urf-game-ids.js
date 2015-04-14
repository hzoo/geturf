module.exports = function(options) {
    const connection = options.connection;
    const lolapi = options.lolapi;
    const region = options.region;
    const nodeENV = options.nodeENV;

    // Get last timeBucket
    // First urf timestamp for NA: 1427866500
    connection.query(`
        SELECT *
        FROM api
        WHERE region='${region}'
    `, function(err, rows) {
        if (err) {
            console.log('Error lastFetch: ' + err);
            if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                throw err;
            }
        }
        let lastFetch = rows[0];
        let lastTimeBucket = lastFetch.lastTimeBucket;

        console.log('Last Fetch: ' + lastTimeBucket);

        cron(lastTimeBucket);
    });

    var longInterval = 300000;
    if (nodeENV === 'production') {
        var shortInterval = process.env['FETCH_URF_IDS_INTERVAL'] || 600;
    } else {
        var shortInterval = 2500;
    }

    function fetchURFMatches(timestamp) {
        // invalid timestamp
        if (timestamp >= 1428917000) {
            console.log('Stopping fetch ids: reached end.');
            return;
        }

        // console.log('Fetching: ' + timestamp + ' for region ' + region);

        lolapi.ApiChallenge.get(timestamp, function(error, result) {
            if (error) {
                console.log('Error: ', timestamp, error);
                cron(timestamp);
            } else {
                if (result.length > 0) {
                    var matchIdQuery = `
                        INSERT INTO matchIDs (
                            timeBucket, matchId, region
                        ) VALUES
                        ${result.map(function(o) {
                            return `(${timestamp},${o},'${region}')`;
                        }).join(',')}
                    `;
                    connection.query(matchIdQuery, function(err) {
                        if (err) {
                            console.log('Error: INSERT matchIds ', error);
                        }
                    });
                }

                // save last updated timestamp
                connection.query(`
                    UPDATE api SET
                        lastTimeBucket=${timestamp}
                    WHERE region='${region}'
                `, function(err) {
                    if (err) {
                        console.log('Error: UPDATE lastTimeBucket ', error);
                    }
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
        }, interval || shortInterval);
    }
}
