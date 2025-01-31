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
    const response = await fetch(`/api/fetch_puuid?region=${region}&gameName=${gameName}&tagLine=${tagLine}`);
    if (!response.ok) {
        response.text().then(text => console.error("Error response:", text));
        throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.puuid;
}


async function getRiotPuuids() {
    let region1 = document.getElementById("region1").value.trim();
    let region2 = document.getElementById("region2").value.trim();
    let gameName1 = document.getElementById("gameName1").value.trim();
    let gameName2 = document.getElementById("gameName2").value.trim();
    let tagLine1 = document.getElementById("tagLine1").value.trim();
    let tagLine2 = document.getElementById("tagLine2").value.trim();

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
        const url = `/api/fetch_summoner?subregion=${subregion}&puuid=${summoner.puuid}`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                let summonerData = await response.json();
                console.log(`Found in ${subregion}:`, summonerData);
                summoner.id = summonerData.id;
                summoner.accountId = summonerData.accountId;
                summoner.lvl = summonerData.summonerLevel;
                summoner.profileIconId = summonerData.profileIconId;
                summoner.region = subregion;
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
    const url = `/api/fetch_soloq_stats?region=${summoner.region}&summonerId=${summoner.id}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            let rankedStats = await response.json();
            if (rankedStats.length === 0) {
                await addDefaultStats(summoner);
                console.log(summoner.rankedStats[0]);
            } else {
                rankedStats.forEach(stat => {
                    summoner.rankedStats.push(stat);
                });
            }
            console.log(`Found ranked stats:`, summoner.rankedStats[0]);
        } else {
            console.log(`No ranked stats found, response code: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error fetching ranked stats:`, error);
    }
}


function showSummonners(summoners) {
    let name1 = document.getElementById("oneName");
    name1.innerText = `${summoners[0].gameName}`;
    let tag1 = document.getElementById("oneTag");
    tag1.innerText = `#${summoners[0].tagLine}`;
    let level1 = document.getElementById("oneLevel");
    level1.innerText = `Level ${summoners[0].lvl}`;
    let region1 = document.getElementById("oneRegion");
    region1.innerText = summoners[0].region.toUpperCase();
    let image1 = document.getElementById("oneImage");
    image1.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoners[0].profileIconId}.jpg`;

    let name2 = document.getElementById("twoName");
    name2.innerText = `${summoners[1].gameName}`;
    let tag2 = document.getElementById("twoTag");
    tag2.innerText = `#${summoners[1].tagLine}`;
    let level2 = document.getElementById("twoLevel");
    level2.innerText = `Level ${summoners[1].lvl}`;
    let region2 = document.getElementById("twoRegion");
    region2.innerText = summoners[1].region.toUpperCase();
    let image2 = document.getElementById("twoImage");
    image2.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoners[1].profileIconId}.jpg`;
}


function showSoloQStats(summoners) {
    let name1 = document.getElementById("oneNameRank");
    name1.innerText = `${summoners[0].gameName} #${summoners[0].tagLine}`;
    let lps1 = document.getElementById("span1Lps");
    lps1.innerText = `${summoners[0].rankedStats[0].leaguePoints}`;
    let tier1 = document.getElementById("oneRank");
    tier1.innerText = `${summoners[0].rankedStats[0].tier} ${summoners[0].rankedStats[0].rank}`;
    let wins1 = document.getElementById("oneWins");
    wins1.innerText = `W: ${summoners[0].rankedStats[0].wins}`;
    let losses1 = document.getElementById("oneLosses");
    losses1.innerText = `L: ${summoners[0].rankedStats[0].losses}`;
    let games1 = document.getElementById("oneGames");
    games1.innerText = `G: ${(summoners[0].rankedStats[0].wins + summoners[0].rankedStats[0].losses)}`
    let winRate = (summoners[0].rankedStats[0].wins / (summoners[0].rankedStats[0].wins + summoners[0].rankedStats[0].losses)) * 100;
    let wr1 = document.getElementById("span1WR");
    wr1.innerText = `${winRate.toFixed(2)}%`;
    let floatWinRate1 = parseFloat(wr1.innerText);
    stylesIfNan(wr1, floatWinRate1);
    let image1 = document.getElementById("oneImageTier");
    image1.src = `static/resources/ranks/${summoners[0].rankedStats[0].tier}.png`;

    let name2 = document.getElementById("twoNameRank");
    name2.innerText = `${summoners[1].gameName} #${summoners[1].tagLine}`;
    let lps2 = document.getElementById("span2Lps");
    lps2.innerText = `${summoners[1].rankedStats[0].leaguePoints}`;
    let tier2 = document.getElementById("twoRank");
    tier2.innerText = `${summoners[1].rankedStats[0].tier} ${summoners[1].rankedStats[0].rank}`;
    let wins2 = document.getElementById("twoWins");
    wins2.innerText = `W: ${summoners[1].rankedStats[0].wins}`;
    let losses2 = document.getElementById("twoLosses");
    losses2.innerText = `L: ${summoners[1].rankedStats[0].losses}`;
    let games2 = document.getElementById("twoGames");
    games2.innerText = `G: ${(summoners[1].rankedStats[0].wins + summoners[1].rankedStats[0].losses)}`
    let winRate2 = (summoners[1].rankedStats[0].wins / (summoners[1].rankedStats[0].wins + summoners[1].rankedStats[0].losses)) * 100;
    let wr2 = document.getElementById("span2WR");
    wr2.innerText = `${winRate2.toFixed(2)}%`;
    let floatWinRate2 = parseFloat(wr2.innerText);
    stylesIfNan(wr2, floatWinRate2);
    let image2 = document.getElementById("twoImageTier");
    image2.src = `static/resources/ranks/${summoners[1].rankedStats[0].tier}.png`;

    console.log(summoners[0].rankedStats[0]);
    console.log(summoners[1].rankedStats[0]);
}


function showFlexQStats(summoners) {
    let name1f = document.getElementById("oneNameFlex");
    name1f.innerText = `${summoners[0].gameName} #${summoners[0].tagLine}`;
    let lps1f = document.getElementById("span1LpsFlex");
    lps1f.innerText = `${summoners[0].rankedStats[1].leaguePoints}`;
    let tier1f = document.getElementById("oneRankFlex");
    tier1f.innerText = `${summoners[0].rankedStats[1].tier} ${summoners[0].rankedStats[1].rank}`;
    let wins1f = document.getElementById("oneWinsFlex");
    wins1f.innerText = `W: ${summoners[0].rankedStats[1].wins}`;
    let losses1f = document.getElementById("oneLossesFlex");
    losses1f.innerText = `L: ${summoners[0].rankedStats[1].losses}`;
    let games1f = document.getElementById("oneGamesFlex");
    games1f.innerText = `G: ${(summoners[0].rankedStats[1].wins + summoners[0].rankedStats[1].losses)}`
    let winRatef = (summoners[0].rankedStats[1].wins / (summoners[0].rankedStats[1].wins + summoners[0].rankedStats[1].losses)) * 100;
    let wr1f = document.getElementById("span1WRFlex");
    wr1f.innerText = `${winRatef.toFixed(2)}%`;
    let floatWinRate1f = parseFloat(wr1f.innerText);
    stylesIfNan(wr1f, floatWinRate1f);
    let image1f = document.getElementById("oneImageTierFlex");
    image1f.src = `static/resources/ranks/${summoners[0].rankedStats[1].tier}.png`;

    let name2f = document.getElementById("twoNameFlex");
    name2f.innerText = `${summoners[1].gameName} #${summoners[1].tagLine}`;
    let lps2f = document.getElementById("span2LpsFlex");
    lps2f.innerText = `${summoners[1].rankedStats[1].leaguePoints}`;
    let tier2f = document.getElementById("twoRankFlex");
    tier2f.innerText = `${summoners[1].rankedStats[1].tier} ${summoners[1].rankedStats[1].rank}`;
    let wins2f = document.getElementById("twoWinsFlex");
    wins2f.innerText = `W: ${summoners[1].rankedStats[1].wins}`;
    let lossesf2 = document.getElementById("twoLossesFlex");
    lossesf2.innerText = `L: ${summoners[1].rankedStats[1].losses}`;
    let gamesf2 = document.getElementById("twoGamesFlex");
    gamesf2.innerText = `G: ${(summoners[1].rankedStats[1].wins + summoners[1].rankedStats[1].losses)}`
    let winRatef2 = (summoners[1].rankedStats[1].wins / (summoners[1].rankedStats[1].wins + summoners[1].rankedStats[1].losses)) * 100;
    let wrf2 = document.getElementById("span2WRFlex");
    wr1f.innerText = `${winRatef2.toFixed(2)}%`;
    let floatWinRate2f = parseFloat(wrf2.innerText);
    stylesIfNan(wrf2, floatWinRate2f);
    let image2f = document.getElementById("twoImageTierFlex");
    image2f.src = `static/resources/ranks/${summoners[1].rankedStats[1].tier}.png`;

    console.log(summoners[0].rankedStats[1]);
    console.log(summoners[1].rankedStats[1]);
}


function stylesIfNan(wr2, floatWinRate2) {
    if (!isNaN(floatWinRate2)) {
        if (floatWinRate2 < 50) {
            wr2.style.color = "red";
            wr2.style.textShadow = "1px 1px 1px black";
        } else {
            wr2.style.color = "green";
            wr2.style.textShadow = "1px 1px 1px black";
        }
    } else {
        wr2.innerText = "0%";
        wr2.style.color = "#EBF4FA";
    }
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
        showFlexQStats(summoners);
    } catch (error) {
        console.error("Error in getHiddenIds:", error);
    } finally {
        let bot_section = document.getElementById("hidden_container");
        bot_section.style.visibility = "visible";
        document.querySelector(".tab button[data-tab='Summoner']").click();

    }
}


async function addDefaultStats(summoner) {
    summoner.rankedStats[0] = {
        tier: "UNRANKED",
        rank: "",
        leaguePoints: "0",
        wins: 0,
        losses: 0,
        inactive: true,
        freshBlood: "",
        hotStreak: "",
        queueType: "RANKED_SOLO_5x5"
    };
    summoner.rankedStats[1] = {
        tier: "UNRANKED",
        rank: "",
        leaguePoints: "0",
        wins: 0,
        losses: 0,
        inactive: true,
        freshBlood: "",
        hotStreak: "",
        queueType: "RANKED_FLEX_5x5"
    };
}
