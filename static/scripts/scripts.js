class Summoner {
    constructor(region, gameName, tagLine, puuid, id, accountId, lvl, profileIconId) {
        this.region = region;
        this.gameName = gameName;
        this.tagLine = tagLine;
        this.puuid = puuid;
        this.id = id;
        this.accountId = accountId;
        this.lvl = lvl;
        this.profileIconId = profileIconId;
        this.rankedStats = [];
    }
}

async function fetchPuuid(region, gameName, tagLine) {
    const response = await fetch(`https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/
    ${gameName}/${tagLine}?api_key=${API_KEY}`);
    if (!response.ok) {
        response.text().then(text => console.error("Error response:", text));
        throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.puuid;
}

async function getRiotPuuids() {
    let region1 = document.getElementById("region1").value;
    let region2 = document.getElementById("region2").value;
    let gameName1 = document.getElementById("gameName1").value;
    let gameName2 = document.getElementById("gameName2").value;
    let tagLine1 = document.getElementById("tagLine1").value;
    let tagLine2 = document.getElementById("tagLine2").value;

    let summoner1 = new Summoner(region1, gameName1, tagLine1, "", "", "", "", "1");
    let summoner2 = new Summoner(region2, gameName2, tagLine2, "", "", "", "", "0");

    try {
        [summoner1.puuid, summoner2.puuid] = await Promise.all([
            fetchPuuid(region1, gameName1, tagLine1),
            fetchPuuid(region2, gameName2, tagLine2)
        ]);
        console.log(`${summoner1.region} ${summoner1.gameName} ${summoner1.tagLine} ${summoner1.puuid}`);
        console.log(`${summoner2.region} ${summoner2.gameName} ${summoner2.tagLine} ${summoner2.puuid}`);
        await getHiddenIds(summoner1, summoner2)
    } catch (error) {
        alert("Request failed. Please check your inputs and try again.");
        return null;
    }

}

async function fetchHiddenIds(summoner) {
    const SUBREGIONS = {
        americas: ["la1", "la2", "na1", "br1"],
        europe: ["euw1", "eun1", "tr1", "ru"],
        asia: ["kr", "jp1", "oc1"]
    };

    for (let subregion of SUBREGIONS[summoner.region.toLowerCase()]) {
        const url = `https://${subregion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${summoner.puuid}?api_key=${API_KEY}`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                let summonerData = await response.json();
                console.log(`Found in ${subregion}:`, summonerData);
                summoner.id = summonerData.id;
                summoner.accountId = summonerData.accountId;
                summoner.lvl = summonerData.summonerLevel;
                summoner.profileIconId = summonerData.profileIconId;
                summoner.region = subregion
                break;
            } else {
                console.log(`Not found in ${subregion}, response code: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error in ${subregion}:`, error);
        }
    }
}

async function fetchSoloQStats(summoner) {
    const url = `https://${summoner.region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}?api_key=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            let rankedStats = await response.json();
            rankedStats.forEach(stat => {
                if (stat.queueType === "RANKED_SOLO_5x5") {
                    summoner.rankedStats[0] = {
                        tier: stat.tier,
                        rank: stat.rank,
                        leaguePoints: stat.leaguePoints,
                        wins: stat.wins,
                        losses: stat.losses,
                        inactive: stat.inactive,
                        freshBlood: stat.freshBlood,
                        hotStreak: stat.hotStreak,
                        queueType: stat.queueType
                    };
                }
            });
        } else {
            console.log(`No ranked stats found, response code: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error fetching ranked stats:`, error);
    }
}

function showSummonners(summoners) {
    let name1 = document.getElementById("oneName");
    name1.innerText = `${summoners[0].gameName}#${summoners[0].tagLine}`;
    let level1 = document.getElementById("oneLevel");
    level1.innerText = `Level ${summoners[0].lvl}`;
    let region1 = document.getElementById("oneRegion");
    region1.innerText = summoners[0].region.toUpperCase();
    let image1 = document.getElementById("oneImage");
    image1.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoners[0].profileIconId}.jpg`;

    let name2 = document.getElementById("twoName");
    name2.innerText = `${summoners[1].gameName}#${summoners[1].tagLine}`;
    let level2 = document.getElementById("twoLevel");
    level2.innerText = `Level ${summoners[1].lvl}`;
    let region2 = document.getElementById("twoRegion");
    region2.innerText = summoners[1].region.toUpperCase();
    let image2 = document.getElementById("twoImage");
    image2.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoners[1].profileIconId}.jpg`;
}

function showSoloQStats(summoners) {
    let name1 = document.getElementById("oneNameRank");
    name1.innerText = `${summoners[0].gameName}#${summoners[0].tagLine}`;
    let lps1 = document.getElementById("oneLps");
    lps1.innerText = `${summoners[0].rankedStats[0].leaguePoints} LPs`;
    let rank1 = document.getElementById("oneRank");
    rank1.innerText = summoners[0].rankedStats[0].rank;
    let tier1 = document.getElementById("oneTier");
    tier1.innerText = summoners[0].rankedStats[0].tier;
    let queue1 = document.getElementById("oneQueue");
    queue1.innerText = summoners[0].rankedStats[0].queueType;
    let image1 = document.getElementById("oneImageTier");
    image1.src = `static/resources/ranks/${summoners[0].rankedStats[0].tier}.webp`;

    let name2 = document.getElementById("twoNameRank");
    name2.innerText = `${summoners[1].gameName}#${summoners[1].tagLine}`;
    let lps2 = document.getElementById("twoLps");
    lps2.innerText = `${summoners[1].rankedStats[0].leaguePoints} LPs`;
    let rank2 = document.getElementById("twoRank");
    rank2.innerText = summoners[1].rankedStats[0].rank;
    let tier2 = document.getElementById("twoTier");
    tier2.innerText = summoners[1].rankedStats[0].tier;
    let queue2 = document.getElementById("twoQueue");
    queue2.innerText = summoners[1].rankedStats[0].queueType;
    let image2 = document.getElementById("twoImageTier");
    image2.src = `static/resources/ranks/${summoners[1].rankedStats[0].tier}.webp`;

    console.log(summoners[0].rankedStats[0]);
    console.log(summoners[1].rankedStats[0]);
}

async function getHiddenIds(summoner1, summoner2) {
    let summoners = [summoner1, summoner2];
    try {
        await Promise.all(summoners.map(summoner => fetchHiddenIds(summoner)));
        await Promise.all(summoners.map(summoner => fetchSoloQStats(summoner)));

        console.log(summoner1.rankedStats[0]);
        console.log(summoner2.rankedStats[0]);

        showSummonners(summoners);
        showSoloQStats(summoners);
    } catch (error) {
        console.error("Error in getHiddenIds:", error);
    } finally {
        let bot_section = document.getElementById("hidden_container");
        bot_section.style.visibility = "visible";
                document.querySelector(".tab button[data-tab='Summoner']").click();

    }
}


