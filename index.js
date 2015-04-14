const nconf = require('nconf');

nconf.argv().env().file({ file: 'config.json' });
var getConfig = conf => process.env[String(conf)] || nconf.get(String(conf));

const region = getConfig('LOL_REGION');
console.log('region: ' + region);
const lolapi = require('lolapi')(getConfig('LOL_TOKEN'), region);

const nodeENV = getConfig('NODE_ENV');

const mysql = require('mysql');
let mysqlOptions = {
  host: getConfig('DB_HOST'),
  user: getConfig('DB_USER'),
  password: getConfig('DB_PASSWORD'),
  database: getConfig('DB_NAME')
};

const fs = require('fs');
const path = require('path');
if (nodeENV === 'production') {
    // (limitPer10s, limitPer10min)
    lolapi.setRateLimit(3000, 180000);
    mysqlOptions.sql = {
        ca: fs.readFileSync(getConfig('SSL_CA')),
        cert: fs.readFileSync(getConfig('SSL_CERT')),
        key: fs.readFileSync(getConfig('SSL_KEY'))
    }
} else {
    lolapi.setRateLimit(10, 500);
}

const connection = mysql.createConnection(mysqlOptions);
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('Fetching URF Game Ids...')
    require('./fetch-urf-game-ids')({
        lolapi: lolapi,
        nodeENV: nodeENV,
        region: region,
        connection: connection
    });

    console.log('Fetching URF Match Data...')
    require('./fetch-urf-match-data')({
        lolapi: lolapi,
        nodeENV: nodeENV,
        region: getConfig('LOL_REGION'),
        connection: connection
    });
});
