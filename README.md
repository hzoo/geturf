Urf
---

Create a json file at `./config.json`.

```json
{
    "FIREBASE_URL_GAMEIDS": "geturf", // https://<THIS-URL>.firebaseio.com/
    "FIREBASE_URL_MATCH_DATA": "urfmatches", 
    "LOL_REGION": "LOL-REGION-HERE", // ex: na
    "LOL_TOKEN": "LOL-API-TOKEN-HERE",
    "HOST": "DB-HOST-HERE", // localhost unless you use a service
    "DB_USER": "DB-USER-HERE",
    "DB_PASSWORD": "DB-PASSWORD-HERE"
}
```

run `npm start`

1. Save List of URF matches from endpoint.
    - For each timestamp (every 5 min): save an array of match IDs
2. For each match ID, get match data from another endpoint
3. Transform result (remove unused fields, etc)
4. Save to db.
5. Figure out queries to send to site
6. Vizualize.
