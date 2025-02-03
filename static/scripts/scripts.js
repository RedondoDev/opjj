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


async function fetchSoloQFlexStats(summoner) {
    const url = `/api/fetch_soloq_stats?region=${summoner.region}&summonerId=${summoner.id}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            let rankedStats = await response.json();
            if (rankedStats.length === 0) {
                await addDefaultStats(summoner, 0, "RANKED_SOLO_5x5");
                await addDefaultStats(summoner, 1, "RANKED_FLEX_SR");
            } else {
                rankedStats.sort((a, b) => {
                    if (a.queueType === "RANKED_SOLO_5x5") return -1;
                    if (b.queueType === "RANKED_SOLO_5x5") return 1;
                    if (a.queueType === "RANKED_FLEX_SR") return -1;
                    if (b.queueType === "RANKED_FLEX_SR") return 1;
                    return 0;
                });
                summoner.rankedStats = rankedStats;
                if (!summoner.rankedStats[1] || summoner.rankedStats[1].queueType !== "RANKED_FLEX_SR") {
                    await addDefaultStats(summoner, 1, "RANKED_FLEX_SR");
                }
            }
        } else {
            console.log(`No ranked stats found, response code: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error fetching ranked stats:`, error);
    }
}


function showSummoners(summoners) {
    const elements = [
        {name: "one", summoner: summoners[0]},
        {name: "two", summoner: summoners[1]}
    ];

    elements.forEach(({name, summoner}) => {
        document.getElementById(`${name}Name`).innerText = summoner.gameName;
        document.getElementById(`${name}Tag`).innerText = `#${summoner.tagLine}`;
        document.getElementById(`${name}Level`).innerText = `Level ${summoner.lvl}`;
        document.getElementById(`${name}Region`).innerText = summoner.region.toUpperCase();
        document.getElementById(`${name}Image`).src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoner.profileIconId}.jpg`;
    });
}


function showSoloQStats(summoners) {
    document.getElementById("oneNameRank").innerText = `${summoners[0].gameName} #${summoners[0].tagLine}`;
    document.getElementById("span1Lps").innerText = `${summoners[0].rankedStats[0].leaguePoints}`;
    document.getElementById("oneRank").innerText = `${summoners[0].rankedStats[0].tier} ${summoners[0].rankedStats[0].rank}`;
    document.getElementById("oneWins").innerText = `W: ${summoners[0].rankedStats[0].wins}`;
    document.getElementById("oneLosses").innerText = `L: ${summoners[0].rankedStats[0].losses}`;
    document.getElementById("oneGames").innerText = `G: ${summoners[0].rankedStats[0].wins + summoners[0].rankedStats[0].losses}`;
    let winRate = 0;
    if (summoners[0].rankedStats[0].wins + summoners[0].rankedStats[0].losses > 0) {
        winRate = (summoners[0].rankedStats[0].wins / (summoners[0].rankedStats[0].wins + summoners[0].rankedStats[0].losses)) * 100;
    }
    let wr1 = document.getElementById("span1WR");
    wr1.innerText = `${winRate.toFixed(2)}%`;
    let floatWinRate1 = parseFloat(wr1.innerText);
    stylesIfNan(wr1, floatWinRate1);
    let image1 = document.getElementById("oneImageTier");
    image1.src = `static/resources/ranks/${summoners[0].rankedStats[0].tier}.png`;

    document.getElementById("twoNameRank").innerText = `${summoners[1].gameName} #${summoners[1].tagLine}`;
    document.getElementById("span2Lps").innerText = `${summoners[1].rankedStats[0].leaguePoints}`;
    document.getElementById("twoRank").innerText = `${summoners[1].rankedStats[0].tier} ${summoners[1].rankedStats[0].rank}`;
    document.getElementById("twoWins").innerText = `W: ${summoners[1].rankedStats[0].wins}`;
    document.getElementById("twoLosses").innerText = `L: ${summoners[1].rankedStats[0].losses}`;
    document.getElementById("twoGames").innerText = `G: ${summoners[1].rankedStats[0].wins + summoners[1].rankedStats[0].losses}`;
    let winRate2 = 0;
    if (summoners[1].rankedStats[0].wins + summoners[1].rankedStats[0].losses > 0) {
        winRate2 = (summoners[1].rankedStats[0].wins / (summoners[1].rankedStats[0].wins + summoners[1].rankedStats[0].losses)) * 100;
    }
    let wr2 = document.getElementById("span2WR");
    wr2.innerText = `${winRate2.toFixed(2)}%`;
    let floatWinRate2 = parseFloat(wr2.innerText);
    stylesIfNan(wr2, floatWinRate2);
    let image2 = document.getElementById("twoImageTier");
    image2.src = `static/resources/ranks/${summoners[1].rankedStats[0].tier}.png`;
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
    games1f.innerText = `G: ${(summoners[0].rankedStats[1].wins + summoners[0].rankedStats[1].losses)}`;

    let winRatef = 0;
    if (summoners[0].rankedStats[1].wins + summoners[0].rankedStats[1].losses > 0) {
        winRatef = (summoners[0].rankedStats[1].wins / (summoners[0].rankedStats[1].wins + summoners[0].rankedStats[1].losses)) * 100;
    }
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
    let losses2f = document.getElementById("twoLossesFlex");
    losses2f.innerText = `L: ${summoners[1].rankedStats[1].losses}`;
    let games2f = document.getElementById("twoGamesFlex");
    games2f.innerText = `G: ${(summoners[1].rankedStats[1].wins + summoners[1].rankedStats[1].losses)}`;

    let winRatef2 = 0;
    if (summoners[1].rankedStats[1].wins + summoners[1].rankedStats[1].losses > 0) {
        winRatef2 = (summoners[1].rankedStats[1].wins / (summoners[1].rankedStats[1].wins + summoners[1].rankedStats[1].losses)) * 100;
    }
    let wr2f = document.getElementById("span2WRFlex");
    wr2f.innerText = `${winRatef2.toFixed(2)}%`;
    let floatWinRate2f = parseFloat(wr2f.innerText);
    stylesIfNan(wr2f, floatWinRate2f);
    let image2f = document.getElementById("twoImageTierFlex");
    image2f.src = `static/resources/ranks/${summoners[1].rankedStats[1].tier}.png`;
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
        await Promise.all(summoners.map(summoner => fetchSoloQFlexStats(summoner)));

        showSummoners(summoners);
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


async function addDefaultStats(summoner, index, queueType) {
    summoner.rankedStats[index] = {
        tier: "UNRANKED",
        rank: "",
        leaguePoints: "0",
        wins: 0,
        losses: 0,
        inactive: true,
        freshBlood: "",
        hotStreak: "",
        queueType: queueType
    };
}
