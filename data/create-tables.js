module.exports = {
    createMatchIDsTable: `
        CREATE TABLE matchIDs (
            id MEDIUMINT NOT NULL AUTO_INCREMENT,
            timeBucket BIGINT UNSIGNED,
            matchId INT UNSIGNED,
            region VARCHAR(4) NOT NULL,
            PRIMARY KEY (id)
        )
    `,
    createAPITable: `
        CREATE TABLE api (
            lastTimestamp BIGINT UNSIGNED,
            matchIndex SMALLINT UNSIGNED,
            region VARCHAR(4) NOT NULL,
            lastTimeBucket BIGINT UNSIGNED,
            PRIMARY KEY (region)
        )
    `,
    populateAPITable: `
        INSERT INTO api
        VALUES (1427865900,0,'BR',1427865900),
               (1427866200,0,'EUNE',1427866200),
               (1427873400,0,'EUW',1427873400),
               (1428360900,0,'KR',1428360900),
               (1427866200,0,'LAN',1427866200),
               (1427865900,0,'LAS',1427865900),
               (1427866500,0,'NA',1427866500),
               (1427865900,0,'OCE',1427865900),
               (1427873400,0,'TR',1427873400),
               (1427873100,0,'RU,1427873100')
    `,
    createBanTable: `
        CREATE TABLE bans (
            championId TINYINT UNSIGNED NOT NULL,
            matchId BIGINT UNSIGNED,
            pickTurn TINYINT UNSIGNED,
            region VARCHAR(4) NOT NULL,
            PRIMARY KEY (matchId, pickTurn, region)
        )
    `,
    createMatchesTable: `
        CREATE TABLE matches (
            matchCreation INT UNSIGNED NOT NULL,
            matchDuration SMALLINT UNSIGNED NOT NULL,
            matchId INT UNSIGNED,
            region VARCHAR(4) NOT NULL,
            PRIMARY KEY (matchId, region)
        )
    `,
    createPlayersTable: `
        CREATE TABLE players (
            matchId INT,
            assists TINYINT,
            championId SMALLINT,
            champLevel TINYINT,
            deaths TINYINT,
            doubleKills TINYINT,
            goldEarned MEDIUMINT,
            highestAchievedSeasonTier VARCHAR(12),
            inhibitorKills TINYINT,
            item0 SMALLINT,
            item1 SMALLINT,
            item2 SMALLINT,
            item3 SMALLINT,
            item4 SMALLINT,
            item5 SMALLINT,
            item6 SMALLINT,
            killingSprees TINYINT,
            kills TINYINT,
            lane VARCHAR(6),
            largestCriticalStrike SMALLINT,
            largestKillingSpree TINYINT,
            largestMultiKill TINYINT,
            magicDamageDealt MEDIUMINT,
            magicDamageDealtToChampions MEDIUMINT,
            magicDamageTaken MEDIUMINT,
            minionsKilled SMALLINT,
            pentaKills TINYINT,
            physicalDamageDealt MEDIUMINT,
            physicalDamageDealtToChampions MEDIUMINT,
            physicalDamageTaken MEDIUMINT,
            quadraKills TINYINT,
            region VARCHAR(4) NOT NULL,
            role VARCHAR(11),
            teamId BIT,
            totalDamageDealt MEDIUMINT,
            totalDamageDealtToChampions MEDIUMINT,
            totalDamageTaken MEDIUMINT,
            totalHeal SMALLINT,
            totalTimeCrowdControlDealt SMALLINT,
            towerKills TINYINT,
            tripleKills TINYINT,
            trueDamageDealt SMALLINT,
            trueDamageDealtToChampions SMALLINT,
            trueDamageTaken SMALLINT,
            unrealKills TINYINT,
            winner BIT,
            PRIMARY KEY (championId, teamId, matchId, region)
        )
    `
}
