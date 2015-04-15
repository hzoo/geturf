Urf
---

## Installation
- [io.js](https://iojs.org/): `nvm install 1.6.3 && nvm use 1.6.3`
- MySQL 5.6 (local or server): `apt-get install mysql-server`

Create a json file at `./data/config.json`.

```json
{
    "LOL_REGION": "LOL-REGION-HERE", // ex: na
    "LOL_TOKEN": "LOL-API-TOKEN-HERE",
    "DB_HOST": "DB-HOST-HERE", // localhost unless you use a service
    "DB_USER": "DB-USER-HERE",
    "DB_PASSWORD": "DB-PASSWORD-HERE",
    "DB_NAME": "DB-DATABASE-NAME",
    "SSL_CA": "blah.pem",
    "SSL_CERT": "blah.pem",
    "SSL_KEY": "blah.pem"
}
```

run `npm start`

## Data Flow
1. Get 5 minute timestamps starting from `1427866500`.
2. Send timestamps to the endpoint `api-challenge-v4.1` to get a list of URF match IDs.
2. For each match ID, get match data from the endpoint `match-v2.2`.
3. Transform result (remove unused fields, etc).
    4. Create tables for matches, players, bans.
4. Save to the databse (firebase -> local -> server db).
5. Figure out queries to send to site.
6. Vizualize.
