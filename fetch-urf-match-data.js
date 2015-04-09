module.exports = function(options) {
    var gameIdsUrl = options.firebaseGameIdsUrl;
    var matchUrl = options.firebaseMatchUrl;
    var Firebase = options.firebase;
    var lolapi = options.lolapi;

    var idsRef = new Firebase(`https://${gameIdsUrl}.firebaseio.com/`);
    var matchesRef = new Firebase(`https://${matchUrl}.firebaseio.com/`);

    var matches = [];
    var currentMatchIndex;
    var timestamp;

    function fetchMatchData(matchId) {
        lolapi.Match.get(matchId, function(error, result) {
            console.log(`Match ID: ${matchId}`);
            if (error) {
                console.log(`Error: ${error}`);
            } else {
                // trim data
                var data = result;
                delete data.mapId;
                delete data.matchId;
                delete data.matchMode;
                delete data.matchType;
                delete data.matchVersion;
                delete data.participantIdentities;
                delete data.queueType;
                delete data.season;
                delete data.region;

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
                    delete d.stats.visionWardsBoughtInGame;
                    delete d.stats.wardsKilled;
                    delete d.stats.wardsPlaced;
                    delete d.timeline.creepsPerMinDeltas;
                    delete d.timeline.damageTakenPerMinDeltas;
                    delete d.timeline.goldPerMinDeltas;
                    delete d.timeline.xpPerMinDeltas;
                });

                data.teams.forEach(function(d) {
                    delete d.vilemawKills;
                    delete d.baronKills;
                    delete d.dominionVictoryScore;
                    delete d.dragonKills;
                    delete d.firstBaron;
                    delete d.firstBlood;
                    delete d.firstDragon;
                    delete d.firstInhibitor;
                    delete d.firstTower;
                    delete d.inhibitorKills;
                    delete d.teamId;
                    delete d.towerKills;
                    delete d.winner;
                });

                // save matchId data
                var resultObject = {};
                resultObject[matchId] = data;
                matchesRef.update(resultObject);

                // save last updated matchId
                matchesRef.update({
                    lastTimestampFetched: {
                        timestamp: timestamp,
                        currentMatchIndex: currentMatchIndex
                    }
                });

                // get next match
                if (currentMatchIndex + 1 < matches.length) {
                    cron(matches[currentMatchIndex++]);
                } else {
                    // get new timestamp (next 5 minutes)
                    timestamp = timestamp + 300;
                    if (timestamp < (Date.now() / 1000)) {
                        idsRef.child(timestamp).on('value', function(snapshot) {
                            var arr = snapshot.val();
                            console.log(arr);

                            matches = arr;
                            currentMatchIndex = 0;
                            cron(matches[currentMatchIndex]);
                        });
                    } else {
                        idsRef.child(timestamp).on('value', function(snapshot) {
                            var arr = snapshot.val();
                            console.log(arr);

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

    // get timestamp of last match saved
    var p1 = new Promise(
    function(resolve) {
      matchesRef.child('lastTimestampFetched').on('value', function(snapshot) {
        resolve(snapshot.val());
      }, function(errorObject) {
        console.log(`matchesRef: The read failed: ${errorObject.code}`);
      });
    });

    p1.then(function(lastTimestampFetched) {
        console.log(lastTimestampFetched);
        timestamp = lastTimestampFetched.timestamp;
        // use timestamp to get array of matches
        idsRef.child(timestamp).on('value', function(snapshot) {
            var arr = snapshot.val();
            console.log(arr);

            matches = arr;
            currentMatchIndex = lastTimestampFetched.currentMatchIndex || 0;
            cron(matches[currentMatchIndex]);
        });
    });
}
