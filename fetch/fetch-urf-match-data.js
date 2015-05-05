module.exports = function(options) {
    const connection = options.connection;
    const lolapi = options.lolapi;
    const region = options.region;
    const nodeENV = options.nodeENV;

    var matches = [];
    var currentMatchIndex = 0;
    var timestamp;

    function getObjectValues(obj) {
        return Object.keys(obj).map(key => {
            if (typeof obj[key] === 'string') {
                return '"' + obj[key] + '"';
            } else {
                return obj[key];
            }
        }).join(',');
    }

    function createInsertQuery(table, obj) {
        return `
            INSERT INTO ${table} (
                ${Object.keys(obj).join(',')}
            )
            VALUES (
                ${getObjectValues(obj)}
            )
        `;
    }

    function createBatchedInsertQuery(table, obj, valuesArr) {
        return `
            INSERT INTO ${table} (
                ${Object.keys(obj).join(',')}
            )
            VALUES
                ${valuesArr.map(function(o) {
                    return `(${o})`;
                }).join(',')}
        `;
    }

    function runBansQuery(data) {
        let bansData = [];

        if (data.teams[0].bans) {
            bansData = bansData.concat(data.teams[0].bans);
        }

        if (data.teams[1].bans) {
            bansData = bansData.concat(data.teams[1].bans);
        }

        var insertBanQueryArr = [];
        bansData.forEach((ban) => {
            // add the matchId as a key
            ban.matchId = data.matchId;

            // add region
            ban.region = data.region;

            // add to db
            insertBanQueryArr.push(getObjectValues(ban));
        });

        if (bansData.length > 0) {
            const insertBanQuery = createBatchedInsertQuery('bans', bansData[0], insertBanQueryArr);
            connection.query(insertBanQuery, function(err, rows) {
                if (err && err.code !== 'ER_DUP_ENTRY') throw err;
            });
        }
    }

    function runMatchesQuery(data) {
        const match = {
            // don't save miliseconds
            matchCreation: Math.floor(Number(data.matchCreation) / 1000),
            matchDuration: data.matchDuration,
            matchId: data.matchId,
            region: data.region
        };

        const insertMatchQuery = createInsertQuery('matches', match);
        connection.query(insertMatchQuery, function(err, rows) {
            if (err && err.code !== 'ER_DUP_ENTRY') throw err;
        });
    }

    function runPlayersQuery(data) {
        var insertPlayersQueryArr = [];
        data.participants.forEach(function(d) {
            delete d.masteries;
            delete d.runes;
            delete d.participantId;
            delete d.spell1Id;
            delete d.spell2Id;
            delete d.stats.combatPlayerScore;
            delete d.stats.firstBloodAssist;
            delete d.stats.firstBloodKill;
            delete d.stats.firstInhibitorAssist;
            delete d.stats.firstInhibitorKill;
            delete d.stats.firstTowerAssist;
            delete d.stats.firstTowerKill;
            delete d.stats.goldSpent;
            delete d.stats.neutralMinionsKilled;
            delete d.stats.neutralMinionsKilledEnemyJungle;
            delete d.stats.neutralMinionsKilledTeamJungle;
            delete d.stats.objectivePlayerScore;
            delete d.stats.sightWardsBoughtInGame;
            delete d.stats.totalPlayerScore;
            delete d.stats.totalScoreRank;
            delete d.stats.totalUnitsHealed;
            delete d.stats.visionWardsBoughtInGame;
            delete d.stats.wardsKilled;
            delete d.stats.wardsPlaced;
            delete d.timeline.creepsPerMinDeltas;
            delete d.timeline.damageTakenPerMinDeltas;
            delete d.timeline.goldPerMinDeltas;
            delete d.timeline.xpPerMinDeltas;
            delete d.timeline.csDiffPerMinDeltas;
            delete d.timeline.damageTakenDiffPerMinDeltas;
            delete d.timeline.xpDiffPerMinDeltas;
        });

        data.participants.forEach(function(d) {
            Object.keys(d.stats).forEach(function(key) {
                d[key] = d.stats[key];
            });
            d.lane = d.timeline.lane;
            d.role = d.timeline.role;
            delete d.stats;
            delete d.timeline;

            // add region
            d.region = data.region;

            // change teamId to a bit
            if (d.teamId === 100) {
                d.teamId = 0;
            } else if (d.teamId === 200) {
                d.teamId = 1;
            }

            // add the matchId as a key
            d.matchId = data.matchId;

            // insert into db
            insertPlayersQueryArr.push(getObjectValues(d));

            // const insertPlayersQuery = createInsertQuery('players', d);
            // connection.query(insertPlayersQuery, function(err, rows) {
            //     if (err && err.code !== 'ER_DUP_ENTRY') throw err;
            // });
        });

        const insertPlayersQuery = createBatchedInsertQuery('players', data.participants[0], insertPlayersQueryArr);
        connection.query(insertPlayersQuery, function(err, rows) {
            if (err && err.code !== 'ER_DUP_ENTRY') throw err;
        });
    }

    var longInterval = 300000;
    if (nodeENV === 'production') {
        var shortInterval = process.env['FETCH_MATCH_INTERVAL'] || 500;
    } else {
        var shortInterval = 1200;
    }

    function fetchMatchData(matchId) {
        lolapi.Match.get(matchId, function(error, result) {
            console.log(`Match ID: ${matchId}`);
            if (error) {
                console.log(`Error: ${error}`);
                console.log(`Retrying...`);
                cron(matches[currentMatchIndex].matchId);
            } else {
                // trim data
                var data = result;

                // bans
                runBansQuery(data);

                // matches
                // runMatchesQuery(data);

                // players
                // runPlayersQuery(data);

                // update last timestamp in db
                const updateAPITable = `
                    UPDATE api SET
                        lastTimestamp=${timestamp},
                        matchIndex=${currentMatchIndex}
                    WHERE region='${data.region}'
                `;
                connection.query(updateAPITable, function(err, rows) {
                    if (err && err.code !== 'ER_DUP_ENTRY') throw err;
                });

                // get next match
                if (currentMatchIndex + 1 < matches.length) {
                    cron(matches[currentMatchIndex++].matchId);
                } else {
                    // get new timestamp (next 5 minutes)
                    currentMatchIndex = 0;
                    timestamp = timestamp + 300;
                    if (timestamp < (Date.now() / 1000)) {
                        fetchMatches({ timestamp });
                    } else {
                        fetchMatches({ timestamp, longInterval });
                    }
                }
            }
        });
    }

    function cron(matchId, interval) {
        setTimeout(function() {
            fetchMatchData(matchId);
        }, interval || shortInterval);
    }

    // get list of matchIds from timestamp
    function fetchMatches({ timestamp, lastFetch, longInterval }) {
        // invalid timestamp
        if (timestamp >= 1428917000) {
            console.log('Stopping fetch matches: reached end.');
            connection.end();
            return;
        }

        connection.query(`
            SELECT matchId
            FROM matchIDs
            WHERE region='${region}'
            AND timeBucket=${timestamp}
            ORDER BY matchId ASC
        `, function(err, arr) {
            if (err) {
                if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                    throw err;
                }
            }
            if (Array.isArray(arr) && arr.length > 0) {
                matches = arr;
                if (lastFetch) {
                    currentMatchIndex = lastFetch.matchIndex || 0;
                }
                if (longInterval) {
                    cron(matches[currentMatchIndex].matchId, longInterval);
                } else {
                    cron(matches[currentMatchIndex].matchId);
                }
            } else {
                console.log('Error fetchMatches: trying ', timestamp + 300);
                connection.query(`
                    SELECT lastTimestamp
                    FROM api
                    WHERE region='${region}'
                `, function(err, arr) {
                    if (err) {
                        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                            throw err;
                        } else {
                            console.log(err);
                        }
                    }

                    const idsLastTimestamp = arr[0].lastTimestamp;
                    console.log('idsLastTimestamp: ' + idsLastTimestamp);

                    if (idsLastTimestamp < timestamp + 300) {
                        setTimeout(function() {
                            fetchMatches({ timestamp: timestamp + 300 });
                        }, longInterval);
                    } else {
                        // fetch next 5 minute interval
                        setTimeout(function() {
                            fetchMatches({ timestamp: timestamp + 300 });
                        }, 100);
                    }
                });
            }
        });
    }

    // get last api stats
    connection.query(`
        SELECT lastTimestamp, matchIndex
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
        timestamp = lastFetch.lastTimestamp;

        console.log('Last Fetch matches: ' + timestamp);

        // use timestamp to get array of matches
        fetchMatches({ timestamp, lastFetch });
    });
}
