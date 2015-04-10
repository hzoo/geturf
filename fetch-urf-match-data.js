module.exports = function(options) {
    const mysql = require('mysql');
    const connection = mysql.createConnection({
      host: options.host,
      user: options.user,
      password: options.password,
      database: 'URF'
    });

    connection.connect();

    const gameIdsUrl = options.firebaseGameIdsUrl;
    const matchUrl = options.firebaseMatchUrl;
    const Firebase = options.firebase;
    const lolapi = options.lolapi;
    const region = options.region;

    const idsRef = new Firebase(`https://${gameIdsUrl}.firebaseio.com/`);
    const matchesRef = new Firebase(`https://${matchUrl}.firebaseio.com/`);

    var matches = [];
    var currentMatchIndex;
    var timestamp;

    function createInsertQuery(table, obj) {
        return `
            INSERT INTO ${table} (
                ${Object.keys(obj).join(',')}
            )
            VALUES (
                ${Object.keys(obj).map(key => {
                    if (typeof obj[key] === 'string') {
                        return '"' + obj[key] + '"';
                    } else {
                        return obj[key];
                    }
                }).join(',')}
            )
        `;
    }

    function fetchMatchData(matchId) {
        lolapi.Match.get(matchId, function(error, result) {
            console.log(`Match ID: ${matchId}`);
            if (error) {
                console.log(`Error: ${error}`);
            } else {
                // trim data
                var data = result;

                // bans
                let bansData = [];

                if (data.teams[0].bans) {
                    bansData.concat(data.teams[0].bans);
                }

                if (data.teams[1].bans) {
                    bansData.concat(data.teams[1].bans);
                }

                bansData.forEach((ban) => {
                    console.log(ban);
                    // add the matchId as a key
                    ban.matchId = matchId;

                    // add region
                    ban.region = data.region;

                    // add to db
                    const insertBanQuery = createInsertQuery('bans', ban);
                    // console.log(insertBanQuery);

                    connection.query(insertBanQuery, function(err, rows) {
                        if (err && err.code !== 'ER_DUP_ENTRY') throw err;
                    });
                });

                // add matches to db
                const match = {
                    // don't save miliseconds
                    matchCreation: Math.floor(Number(data.matchCreation) / 1000),
                    matchDuration: data.matchDuration,
                    matchId: data.matchId,
                    region: data.region
                }
                // console.log(match);

                const insertMatchQuery = createInsertQuery('matches', match);
                // console.log(insertMatchQuery);

                connection.query(insertMatchQuery, function(err, rows) {
                    if (err && err.code !== 'ER_DUP_ENTRY') throw err;
                });

                // add champion data
                // filter data
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
                    const insertPlayersQuery = createInsertQuery('players', d);
                    // console.log(insertPlayersQuery);

                    connection.query(insertPlayersQuery, function(err, rows) {
                        if (err && err.code !== 'ER_DUP_ENTRY') throw err;
                    });
                });

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
                    cron(matches[currentMatchIndex++]);
                } else {
                    // get new timestamp (next 5 minutes)
                    timestamp = timestamp + 300;
                    if (timestamp < (Date.now() / 1000)) {
                        idsRef.child(timestamp).on('value', function(snapshot) {
                            const arr = snapshot.val();
                            console.log('num matches: ' + arr.length);

                            matches = arr;
                            currentMatchIndex = 0;
                            cron(matches[currentMatchIndex]);
                        });
                    } else {
                        idsRef.child(timestamp).on('value', function(snapshot) {
                            const arr = snapshot.val();
                            console.log('num matches: ' + arr.length);

                            matches = arr;
                            currentMatchIndex = 0;
                            cron(matches[currentMatchIndex], 600000);
                        });
                    }
                }
            }
        });
    }

    function cron(matchId, interval) {
        setTimeout(function() {
            fetchMatchData(matchId);
        }, interval || 1250);
    }

    // get last api stats
    connection.query(`
        SELECT lastTimestamp, matchIndex
        FROM api
        WHERE region='${region}'
    `, function(err, rows) {
        if (err) throw err;
        let lastTimestampFetched = rows[0];
        timestamp = lastTimestampFetched.lastTimestamp;

        console.log('p1 then: ' + timestamp);
        // use timestamp to get array of matches
        idsRef.child(timestamp).on('value', function(snapshot) {
            const arr = snapshot.val();
            console.log('num matches: ' + arr.length);

            matches = arr;
            currentMatchIndex = lastTimestampFetched.currentMatchIndex || 0;
            cron(matches[currentMatchIndex]);
        });
    });
}
