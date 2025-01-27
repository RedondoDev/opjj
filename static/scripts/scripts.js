class Summoner {
    constructor(region, gameName, tagLine, puuid, id, accountId, lvl) {
        this.region = region;
        this.gameName = gameName;
        this.tagLine = tagLine;
        this.puuid = puuid;
        this.id = id;
        this.accountId = accountId;
        this.lvl = lvl;
    }
}

async function fetchPuuid(region, gameName, tagLine) {
    const response = await fetch(`https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/
    ${gameName}/${tagLine}?api_key=${API_KEY}`);
    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
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

    let summoner1 = new Summoner(region1, gameName1, tagLine1, "");
    let summoner2 = new Summoner(region2, gameName2, tagLine2, "");

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
        let url = `https://${subregion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${summoner.puuid}?api_key=${API_KEY}`;
        try {
            let response = await fetch(url);
            if (response.ok) {
                let summonerData = await response.json();
                console.log(`Found in ${subregion}:`, summonerData);
                summoner.id = summonerData.id;
                summoner.accountId = summonerData.accountId;
                summoner.lvl = summonerData.summonerLevel;
                break;
            } else {
                console.log(`Not found in ${subregion}, response code: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error in ${subregion}:`, error);
        }
    }
}

async function getHiddenIds(summoner1, summoner2) {
    let summoners = [summoner1, summoner2];
    await Promise.all(summoners.map(summoner => fetchHiddenIds(summoner)));
    let bot_section = document.getElementById("bot_section");
    bot_section.style.visibility = "visible";
    console.log(summoners);
}
