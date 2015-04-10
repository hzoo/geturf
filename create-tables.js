module.exports = {
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
            goldEarned SMALLINT,
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
            magicDamageDealt INT,
            magicDamageDealtToChampions INT,
            magicDamageTaken INT,
            minionsKilled SMALLINT,
            pentaKills TINYINT,
            physicalDamageDealt INT,
            physicalDamageDealtToChampions INT,
            physicalDamageTaken INT,
            quadraKills TINYINT,
            region VARCHAR(4) NOT NULL,
            role VARCHAR(11),
            teamId BIT,
            totalDamageDealt INT,
            totalDamageDealtToChampions INT,
            totalDamageTaken INT,
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
