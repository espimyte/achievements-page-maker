import fs from 'fs'
import path from 'path'
import { writeJSON, fetchJSON, fetchJSONfromURL, saveImageFromURL } from './utils.js'
import { MANUAL_INCLUDE_IDS, EXCLUDE_IDS, OUTPUT_FOLDER } from './config.js'

/** Returns whether or not the Steam profile is public. */
async function isProfilePublic(userId) {
    const apiKey = process.env.STEAM_API_KEY

    const res = await fetchJSONfromURL(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=400&key=${apiKey}&steamid=${userId}`);
    return res.playerstats.error !== "Profile is not public";
}

/**
 * Gets user data and writes JSON files
 * Only works if profile and game details are set to public.
 */
async function getUserData(userId) {
    const apiKey = process.env.STEAM_API_KEY

    // Get owned games
    const ownedGames = await fetchJSONfromURL(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${userId}&format=json&include_played_free_games=true`)

    // Create query from owned games and manual include games
    let appIds = ownedGames.response.games.map((game) => game.appid)
    appIds = [...appIds, ...MANUAL_INCLUDE_IDS];
    appIds = appIds.filter((appId) => !EXCLUDE_IDS.includes(appId))
    const query = appIds.map((appId, i) => `appids[${i}]=${appId}`).join("&")

    // Get achievement schemas
    const schemas = await fetchJSONfromURL(`https://api.steampowered.com/IPlayerService/GetTopAchievementsForGames/v1/?key=${apiKey}&steamid=${userId}&language=en&max_achievements=10000&${query}`);

    // Get unlock times
    const promises = [];
    const unlockTimes = {};
    schemas.response.games.forEach((game) => {
        if (!game.achievements) return;
        
        const promise = fetchJSONfromURL(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${game.appid}&key=${apiKey}&steamid=${userId}`);

        promise.then((data) => {
            unlockTimes[game.appid] = data;
        })
        promises.push(promise);
    });

    await Promise.all(promises);
    return {schemas: schemas, unlockTimes: unlockTimes}
}

async function main() {
    // Load .env
    process.loadEnvFile(".env");
    if (!process.env.STEAM_API_KEY) {
        console.error("\x1b[31mSteam API key not set.\x1b[0m")
        return;
    }
    if (!process.env.STEAM_USER_ID) {
        console.error("\x1b[31mSteam User ID not set.\x1b[0m")
        return;
    }
    const userId = process.env.STEAM_USER_ID;

    // Check if profile is public
    const isPublic = await isProfilePublic(userId);
    if (!isPublic) {
        console.error("\x1b[31mProfile is private. Aborting...\x1b[0m");
        return;
    }

    // Fetch user data
    const userData = await getUserData(userId);
    const unlockTimes = userData.unlockTimes;
    const schemas = userData.schemas;
    const gameDict = {};

    // Create keys using game names
    Object.entries(unlockTimes).forEach((entry) => {
        if (entry[1].playerstats.error) return;
        const gameKey = entry[1].playerstats.gameName.replace(/[^A-Z0-9]+/ig, "_").toLowerCase();
        gameDict[entry[0]] = { key: gameKey, title: entry[1].playerstats.gameName};
    });

    // Save achievement icons of achieved achievements from schemas
    Object.values(schemas.response.games).forEach((data) => {
        data.achievements?.forEach((ach) => {
            if (!gameDict[data.appid]) return;

            const imageUrl = `http://shared.fastly.steamstatic.com/community_assets/images/apps/${data.appid}/${ach.icon}`

            const file = `${OUTPUT_FOLDER}/icons/${gameDict[data.appid].key}/${ach.icon}`;
            if (fs.existsSync(file)) return;
            if (!fs.existsSync(path.dirname(file))) {
                fs.mkdirSync(path.dirname(file), {recursive: true})
            }
            saveImageFromURL(file, imageUrl);
        })
    });

    // Populate games in achievements.json
    let json = fetchJSON(`${OUTPUT_FOLDER}/achievements.json`);
    if (!json) json = {"games": {}, "achievements": []}
    Object.values(gameDict).forEach((game) => {
        if (!json.games[game.key]) {
            json.games[game.key] = {title: game.title}
        }
    })

    // Clear steam achievements in json
    json.achievements = json.achievements.filter((ach) => {
        return ach.src !== "steam";
    });

    // Populate achievements in achievements.json
    Object.values(schemas.response.games).forEach((data) => {
        if (unlockTimes[data.appid]?.playerstats.error) return;
        if (!data.achievements) return;

        const sortedAchData = data.achievements.toSorted((a, b) => {
            if (a.statid === b.statid) return (a.bit > b.bit) || -(a.bit < b.bit);
            return (a.statid > b.statid) || -(a.statid < b.statid);
        })

        const filteredUnlockTimes = unlockTimes[data.appid]?.playerstats.achievements.filter((utAch) => utAch.achieved);

        const mergedAchData = sortedAchData.map((ach, i) => {
            return {...ach, unlockTime: filteredUnlockTimes[i].unlocktime}
        })
        
        mergedAchData.forEach((ach, i) => {
            const gameKey = gameDict[data.appid]?.key;
            if (!gameKey) return;

            const achEntry = {};
            achEntry.game = gameKey;
            achEntry.timestamp = ach.unlockTime;
            achEntry.title = ach.name;
            achEntry.desc = ach.desc;
            achEntry.img = `${OUTPUT_FOLDER}/icons/${gameKey}/${ach.icon}`;
            achEntry.src = 'steam';
            json.achievements.push(achEntry);
        })
    });

    // Last updated
    json.last_updated = Date.now();
    
    writeJSON(`${OUTPUT_FOLDER}/achievements.json`, json);
}

main()