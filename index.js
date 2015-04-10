const nconf = require('nconf');
const Firebase = require('firebase');

nconf.argv().env().file({ file: 'config.json' });
var getConfig = conf => process.env[String(conf)] || nconf.get(String(conf));

const lolapi = require('lolapi')(getConfig('LOL_TOKEN'), getConfig('LOL_REGION'));

// (limitPer10s, limitPer10min)
const nodeENV = getConfig('NODE_ENV');
if (nodeENV === 'production') {
    lolapi.setRateLimit(3000, 180000);
} else {
    lolapi.setRateLimit(10, 500);
}

console.log('Fetching URF Game Ids...')
require('./fetch-urf-game-ids')({
    firebase: Firebase,
    lolapi: lolapi,
    nodeENV: nodeENV,
    region: getConfig('LOL_REGION'),
    firebaseUrl: getConfig('FIREBASE_URL_GAMEIDS')
});

console.log('Fetching URF Match Data...')
require('./fetch-urf-match-data')({
    firebase: Firebase,
    lolapi: lolapi,
    nodeENV: nodeENV,
    region: getConfig('LOL_REGION'),
    firebaseGameIdsUrl: getConfig('FIREBASE_URL_GAMEIDS'),
    firebaseMatchUrl: getConfig('FIREBASE_URL_MATCH_DATA'),
    host: getConfig('DB_HOST'),
    user: getConfig('DB_USER'),
    password: getConfig('DB_PASSWORD')
});

// console.log('test');
// require('./test')({
//     firebase: Firebase,
//     lolapi: lolapi,
//     region: getConfig('LOL_REGION'),
//     firebaseGameIdsUrl: getConfig('FIREBASE_URL_GAMEIDS'),
//     firebaseMatchUrl: getConfig('FIREBASE_URL_MATCH_DATA')
// });
