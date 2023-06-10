var button = document.getElementById("button");
var siteBanner = document.getElementById("site");
var wrongSiteBanner = document.getElementById("wrong-site")
var missingPricesBanner = document.getElementById("missing-prices");
var updated = document.getElementById("updated");
var loader = document.getElementById("loader");
var siteLink = document.getElementById("site-link");

async function GetCurrentTab() {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

function SetState() {
    localStorage.popupState = JSON.stringify(state);
}

function GetState() {
    if (localStorage.popupState) {
        var state = JSON.parse(localStorage.popupState);
        state.loading = false;
        return state;
    } else {
        return {
            updated: null,
            missingPrices: false,
            loading: false
        }
    }
}

const state = GetState()
init();

async function init() {
    siteLink.addEventListener("click", (e) => {
        e.preventDefault();
        var link = e.target.getAttribute("href")
        console.log(link);
        chrome.tabs.create({ url: link });
    })
    button.addEventListener("click", (e) => {
        sync()
    });

    var tab = await GetCurrentTab();
    console.log(tab.url);

    if (!tab.url.startsWith("https://eco-calc.com/")) {
        wrongSiteBanner.style.display = "block"
        siteBanner.style.display = "none"
        return;
    }
    updateBanner();
}

async function sync() {
    if (state.loading) {
        return;
    }
    state.loading = true
    loader.style.display = "flex"
    await toggleBodyBlur();
    setTimeout(() => {
        syncData()
    }, 1000);
}

function updateBanner() {
    var message = "";
    if (state.updated) {
        message = `Refreshed ${new Date(state.updated).toLocaleString()}`
    }
    updated.innerText = message;
    loader.style.display = "none"
    if (state.missingPrices) {
        missingPricesBanner.style.display = "block";
    } else {
        missingPricesBanner.style.display = "none";
    }
    wrongSiteBanner.style.display = "none"
    siteBanner.style.display = "block"
}
async function getApiData() {
    var response = await fetch("http://good-game.top:3001/elixr-mods/framework/api/v1/get-prices/false")
    return await response.json();
}

async function syncData() {
    var tab = await GetCurrentTab();
    var websiteData = await chrome.tabs.sendMessage(tab.id, { type: "GETDATA" });
    var apiData = await getApiData();
    await submitData(apiData, websiteData.ingredients, websiteData.supermap);
}

async function submitData(data, ingredients, supermap) {
    let missingPrices = false
    const filteredData = data.filter(obj => obj.ForSale);

    var pricesByTagItemName = filteredData.reduce((map, obj) => {
        map[obj.tagItemName] ??= [];
        map[obj.tagItemName].push(obj);
        return map;
    }, {});

    for (var ingredient of ingredients) {
        var id = ingredient.id; // calc id = BasicUpgrade1Item
        var name = supermap[id] || id; // eco name = Basic Upgrade 1
        if (!(name in pricesByTagItemName)) {
            if (ingredient.pr <= 0) {
                missingPrices = true;
            }
            continue;
        }

        var prices = pricesByTagItemName[name];
        var minPrice = Math.min.apply(null, prices.map(x => x.Price));
        var maxPrice = Math.max.apply(null, prices.map(x => x.Price));

        if (ingredient.pr !== minPrice) {
            console.log(`ingredient ${name} was ${ingredient.pr}, is now ${minPrice}/${maxPrice}`);
            ingredient.pr = minPrice;
        }
    }

    state.missingPrices = missingPrices;
    state.updated = Date.now();
    state.loading = false;

    SetState();
    var tab = await GetCurrentTab();
    var response = await chrome.tabs.sendMessage(tab.id, { type: "SETDATA", ingredients: ingredients });
    updateBanner();
}

async function toggleBodyBlur() {
    var tab = await GetCurrentTab();
    await chrome.tabs.sendMessage(tab.id, { type: "SHOWOVERLAY" });
}