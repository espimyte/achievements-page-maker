import fs from 'fs'
import path from 'path'
import { writeJSON, fetchJSON, fetchJSONfromURL, saveImageFromURL } from './utils.js'
import { STEAM_API_KEY, STEAM_USER_ID, OUTPUT_FOLDER } from './secret.js'

// Games whose achievements to exclude from the site
const EXCLUDED_GAMES = [
    "spelunky",
    "battleblock_theater",
    "tabletop_simulator",
    "enter_the_gungeon",
    "starbound_unstable",
    "ori_and_the_blind_forest_definitive_edition",
    "the_jackbox_party_pack_3",
    "the_jackbox_party_pack_5",
    "the_jackbox_party_pack_6",
    "the_jackbox_party_pack_7",
    "the_jackbox_party_pack_8",
    "among_us",
    "bloons_td_6",
    "if_found",
    "sea_of_thieves",
    "dokapon_kingdom_connect",
    "warframe",
    "dungeon_defenders_ii"
]

// App ID of games that aren't included in the owned games list (eg. not owned for some reason)
const MANUAL_INCLUDE_GAMES = [
    420530, // OneShot
]

/** Returns whether or not the Steam profile is public. */
async function isProfilePublic() {
    const res = await fetchJSONfromURL(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=400&key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}`);
    return res.playerstats.error !== "Profile is not public";
}

/**
 * Gets user data and writes JSON files
 * Only works if profile and game details are set to public.
 */
async function getUserData() {
    // Get owned games
    const ownedGames = await fetchJSONfromURL(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}&format=json&include_played_free_games=true`)

    // Create query from owned games and manual include games
    let appIds = ownedGames.response.games.map((game) => game.appid)
    appIds = [...appIds, ...MANUAL_INCLUDE_GAMES];
    const query = appIds.map((appId, i) => `appids[${i}]=${appId}`).join("&")

    // Get achievement schemas
    const schemas = await fetchJSONfromURL(`https://api.steampowered.com/IPlayerService/GetTopAchievementsForGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}&language=en&max_achievements=10000&${query}`);

    // Get unlock times
    const promises = [];
    const unlockTimes = {};
    schemas.response.games.forEach((game) => {
        if (!game.achievements) return;
        
        const promise = fetchJSONfromURL(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${game.appid}&key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}`);

        promise.then((data) => {
            unlockTimes[game.appid] = data;
        })
        promises.push(promise);
    });
    await Promise.all(promises);

    return {schemas: schemas, unlockTimes: unlockTimes}
}

async function main() {
    const isPublic = await isProfilePublic();
    if (!isPublic) {
        console.log("\x1b[31mProfile is private. Aborting...\x1b[0m");
        return;
    }

    const userData = await getUserData();

    const unlockTimes = userData.unlockTimes;
    const schemas = userData.schemas;
    const gameDict = {};

    // Create keys using game names
    Object.entries(unlockTimes).forEach((entry) => {
        if (entry[1].playerstats.error) return;
        const gameKey = entry[1].playerstats.gameName.replace(/[^A-Z0-9]+/ig, "_").toLowerCase();
        if (EXCLUDED_GAMES.includes(gameKey)) return;
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