/* 
 * Author: espimyte (espy.world) 
 * https://github.com/espimyte/achievements-collector
 */

const Groupings = { DATE: "date", GAMES: "games" };

const mainEl = document.getElementById("main");
const achievementsEl = document.getElementById("achievements");
const achCount = document.getElementById("ach_count");
const groupingCheckbox = document.getElementById("grouping");
const loadMoreButton = document.getElementById("load_more");
loadMoreButton.disabled = true;

let achLists = [];
let pressedAchs = [];
let prevX = 0;
let prevY = 0;

const borderBuffer = 30;

/** Resizes achievements list based on screen size */
addEventListener("resize", clampSize);

function clampSize() {
    const windowWidth = document.body.clientWidth;
    const extraSpace = (windowWidth - borderBuffer) % achSize;

    achLists.forEach((achList) => {
        const achCount = achList.childElementCount;
        let achsPerRow = (windowWidth - extraSpace - borderBuffer) / achSize;
        let emptyCells =
            achsPerRow >= achCount ? 0 : achsPerRow - (achCount % achsPerRow);
        let rowCount = Math.ceil(achCount / achsPerRow);

        while (emptyCells > rowCount) {
            achsPerRow--;
            emptyCells =
                achsPerRow >= achCount ? 0 : achsPerRow - (achCount % achsPerRow);
            rowCount = Math.ceil(achCount / achsPerRow);
        }

        achList.style.maxWidth = `${Math.min(windowWidth - extraSpace - borderBuffer, achCount * achSize, achsPerRow * achSize)}px`;
    });
}

/** Populates with achievement data */
async function waitForAchData() {
    const res = await fetch(jsonPath);
    if (!res.ok) return undefined;
    const data = await res.json();

    // Sort achievements
    data.achievements.sort((a, b) => {
        if (!a.timestamp) return true;
        return b.timestamp > a.timestamp || -(b.timestamp < a.timestamp);
    });

    return data;
}

/* Clears achievements lists */
function clearAchievementsLists() {
    achievementsEl.innerHTML = "";
    achLists = [];
}

/** Add an achievement list */
function addAchList() {
    const achList = document.createElement("div");
    achList.classList.add("ach-list");
    achLists.push(achList);
    return achList;
}

/** Create an element to represent an achievement */
function createAchEl(data, ach) {
    const achEl = document.createElement("div");
    achEl.className = `ach ${ach.game}`;
    achEl.style.width = `${achSize}px`;
    achEl.style.height = `${achSize}px`;

    const gameData = data.games[ach.game];
    if (!gameData) return;
    const gameTitle = data.games[ach.game].title;

    const hasInvalidDate = !ach.timestamp || ach.timestamp == 0;
    const hasInvalidDesc = ach.desc.includes("NEW_ACHIEVEMENT");
    const unlockDate = new Date(ach.timestamp * 1000).toLocaleDateString(
        "en-US",
    );

    const achLoading = document.createElement("div");
    achLoading.className = "ach-loading";
    achEl.appendChild(achLoading);

    const achImg = document.createElement("img");
    achImg.loading = "lazy";
    achImg.className = "ach-img";
    achImg.src = `${useRootPath ? "/" : ""}${ach.img}`;
    achImg.style.width = `${achSize}px`;
    achImg.style.height = `${achSize}px`;
    achEl.appendChild(achImg);

    const achTooltip = document.createElement("div");
    achTooltip.className = "ach-tooltip";
    achTooltip.innerHTML = `
    <div style="display: flex; gap: 5px">
        <span class="ach-game">[${gameTitle}]</span><span class="ach-title">${ach.title}</span>
        <span class="ach-date" style="flex-grow: 1; text-align: right; margin-left: 5px;">
            ${hasInvalidDate ? "N/A" : unlockDate}
        </span>
    </div>
    <span class="ach-desc ${hasInvalidDesc ? "invalid" : ""}">${ach.desc}</span>`;
    achEl.appendChild(achTooltip);

    achImg.onload = () => {
        achLoading.remove();
    };

    achEl.onclick = (e) => {
        if (achEl.classList.contains("lifted")) {
            unselectAll();
        } else {
            unselectAll();
            selectAch(achEl, true);
        }
    };
    return achEl;
}

let achDataPromise = this.waitForAchData();

/** Populate achievements sorted by date */
function initDate(data) {
    clearAchievementsLists();

    let count = 0;

    if (!data) return;
    if (data.achievements.length <= 0) return;
    const achList = addAchList();
    achievementsEl.appendChild(achList);

    const moreIndicator = document.createElement("div");
    moreIndicator.id = "more_indicator";
    moreIndicator.style.width = `${achSize}px`;
    moreIndicator.style.height = `${achSize}px`;
    achList.appendChild(moreIndicator);

    function loadAchievements(start, end) {
        end = Math.min(end, data.achievements.length);
        for (i = start; i < end; i++) {
            const achEl = createAchEl(data, data.achievements[i]);
            achEl.id = `ach_${i}`;
            if (!achEl) continue;
            achList.appendChild(achEl);

            if (i === end - 1) {
                achList.appendChild(moreIndicator);
                moreIndicator.textContent = `+${data.achievements.length - end}`;
            }
            if (data.achievements.length - end <= 0) {
                moreIndicator.remove();
            }
        }
        count += end - start;
        achCount.textContent = `${end}`;
    }

    // Initial load
    loadAchievements(0, initialLoadCount);

    // Load more
    if (count < data.achievements.length) {
        loadMoreButton.disabled = false;
    }
    loadMoreButton.onclick = (e) => {
        loadAchievements(count, count + loadIncrement);
        if (count >= data.achievements.length) {
            loadMoreButton.disabled = true;
        }
    };

    clampSize();
}

/** Populate achievements grouped by game */
function initGroup(data) {
    clearAchievementsLists();
    const gameAchs = {};
    const gamesInOrder = [];

    let currentGoal = initialLoadCount;
    let count = 0;
    let gameCount = 0;

    data.achievements.forEach((ach) => {
        if (!(ach.game in gameAchs)) {
            gameAchs[ach.game] = [];
            gamesInOrder.push(ach.game);
        }
        gameAchs[ach.game].push(ach);
    });

    const loadNextGameAchs = () => {
        const game = gamesInOrder[gameCount];
        if (!game) return;

        const achGroup = document.createElement("div");
        achGroup.classList = "ach-group";
        const achGroupTitle = document.createElement("h2");
        achGroupTitle.className = "ach-group-title";
        achGroupTitle.textContent = data.games[game].title;
        achGroup.appendChild(achGroupTitle);

        const achList = addAchList();
        achList.classList.add(`list-${game}`);
        gameAchs[game].forEach((ach) => {
            const achEl = createAchEl(data, ach);
            achList.appendChild(achEl);
            count++;
        });

        achievementsEl.appendChild(achGroup);
        achGroup.appendChild(achList);
        gameCount++;
        achCount.textContent = `${count}`;

        clampSize();
        if (count < currentGoal) loadNextGameAchs();
        if (count < data.achievements.length) {
            loadMoreButton.disabled = false;
        } else loadMoreButton.disabled = true;
    };

    loadNextGameAchs();

    // Load more
    loadMoreButton.onclick = () => {
        currentGoal = count + loadIncrement;
        loadNextGameAchs();
        if (count >= data.achievements.length) {
            loadMoreButton.disabled = true;
        }
    };
}

/** Populate achievements when achievement data loads */
achDataPromise.then((data) => {
    let grouping = groupingCheckbox.checked
        ? Groupings.GAMES
        : Groupings.DATE;
    groupingCheckbox.addEventListener("click", () => {
        if (groupingCheckbox.checked) grouping = Groupings.GAMES;
        else grouping = Groupings.DATE;

        if (grouping == Groupings.DATE) {
            initDate(data);
        } else if (grouping == Groupings.GAMES) {
            initGroup(data);
        }
    });

    if (grouping == Groupings.DATE) {
        initDate(data);
    } else if (grouping == Groupings.GAMES) {
        initGroup(data);
    }

    if (data.last_updated !== 0) {
        const lastUpdated = document.getElementById("last_updated");
        lastUpdated.textContent = new Date(
            data.last_updated,
        ).toLocaleDateString("en-US");
    }

    const achTotal = document.getElementById("ach_total");
    achTotal.textContent = `${data.achievements.length}`;
});

/** Handles smoother mouse hover effects */
function getPositionAlongTheLine(x1, y1, x2, y2, percentage) {
    return {
        x: x1 * (1.0 - percentage) + x2 * percentage,
        y: y1 * (1.0 - percentage) + y2 * percentage,
    };
}

function isOffscreen(rect) {
    return (
        rect.x + rect.width < 0 ||
        rect.y + rect.height < 0 ||
        rect.x > window.innerWidth ||
        rect.y > window.innerHeight
    );
}

window.onpointermove = function (event) {
    const { clientX, clientY } = event;

    const diffX = Math.abs(prevX - event.clientX);
    const diffY = Math.abs(prevY - event.clientY);
    const diff = ((diffX ^ 2) + (diffY ^ 2)) ^ (1 / 2);

    // Steps needed
    const stepSize = achSize;
    const stepsNeeded = Math.floor(diff / stepSize);
    const percent = 1 / stepsNeeded;

    const pointsToCheck = [];

    for (let i = 0; i < stepsNeeded; i++) {
        const pointPos = getPositionAlongTheLine(
            prevX,
            prevY,
            event.clientX,
            event.clientY,
            percent * (i + 1),
        );
        pointsToCheck.push(pointPos);
    }

    prevX = event.clientX;
    prevY = event.clientY;

    const liftedAchs = [...pressedAchs];
    unselectAll();

    achLists.forEach((achList) => {
        achList.childNodes.forEach((c) => {
            if (c.id === "more_indicator") return;
            var rect = c.getBoundingClientRect();
            const offscreen = isOffscreen(rect);
            if (offscreen) return;

            pointsToCheck.push({ x: event.clientX, y: event.clientY });

            let lifted = false;

            pointsToCheck.forEach((point) => {
                if (lifted) return;

                if (isPointInRect(point.x, point.y, rect)) {
                    selectAch(c);
                    lifted = true;
                }
            });
        });
    });

    const lastPressedAch = pressedAchs[pressedAchs.length - 1];

    if (lastPressedAch) {
        const cTooltip = lastPressedAch.tooltip;
        showTooltip(cTooltip);
    }
};

function isPointInRect(x, y, rect) {
    const inBoxX = x > rect.left && x - rect.left <= achSize;
    const inBoxY = y > rect.top && y - rect.top <= achSize;
    return inBoxX && inBoxY;
}

/** Handles showing achievement tooltip when hovered over */
function selectAch(c, tooltip = false) {
    c.classList.add("lifted");
    const cImg = c.getElementsByTagName("img")[0];
    if (cImg.complete) {
        cImg.style.transform = `translateY(-10px)`;
        cImg.style.transition = `transform 0s`;
        cImg.style.boxShadow = `0px 0px 10px white`;
        cImg.style.zIndex = `10`;
    }
    const cTooltip = c.getElementsByTagName("div")[0];
    pressedAchs.push({ id: c.id, parent: c, img: cImg, tooltip: cTooltip });
    if (tooltip) showTooltip(cTooltip);
}

function showTooltip(tooltip) {
    tooltip.style.visibility = "visible";
    let tooltipRect = tooltip.getBoundingClientRect();

    // Resize tooltip width if too large
    if (tooltipRect.width > document.body.clientWidth) {
        tooltip.style.whiteSpace = "unset";
        tooltip.style.width = `${document.body.clientWidth - 20}px`;
        tooltipRect = tooltip.getBoundingClientRect();
    }

    // Align tooltip to be fully on screen
    if (tooltipRect.right > document.body.clientWidth) {
        tooltip.style.transform = `translateX(calc(-50% - ${tooltipRect.right - document.body.clientWidth + 5}px))`;
    } else if (tooltipRect.left < 0) {
        tooltip.style.transform = `translateX(calc(-50% - ${tooltipRect.left - 5}px))`;
    }
}

function unselectAll() {
    pressedAchs.forEach((ach) => {
        ach.parent.classList.remove("lifted");
        ach.img.style = ``;
        ach.img.style.width = `${achSize}px`
        ach.img.style.height = `${achSize}px`
        ach.img.style.transition = `transform 0.5s`;
        ach.tooltip.style = "";
    });
    pressedAchs = [];
}