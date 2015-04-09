var nconf = require('nconf');
var Firebase = require('firebase');

nconf.argv().env().file({ file: 'config.json' });
function getConfig(option) {
    return process.env[String(option)] || nconf.get(String(option));
}

var lolRegion = getConfig('LOL_REGION');
var lolToken = getConfig('LOL_TOKEN');
var lolapi = require('lolapi')(lolToken, lolRegion);
lolapi.setRateLimit(10, 500); // (limitPer10s, limitPer10min)

console.log('Fetching URF Game Ids...')
require('./fetch-urf-game-ids')({
    firebase: Firebase,
    lolapi: lolapi,
    firebaseUrl: getConfig('FIREBASE_URL_GAMEIDS')
});

console.log('Fetching URF Match Data...')
require('./fetch-urf-match-data')({
    firebase: Firebase,
    lolapi: lolapi,
    firebaseGameIdsUrl: getConfig('FIREBASE_URL_GAMEIDS'),
    firebaseMatchUrl: getConfig('FIREBASE_URL_MATCH_DATA')
});
