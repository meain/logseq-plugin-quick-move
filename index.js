import "@logseq/libs";

export const getLastBlock = async function (pageName) {
    let blocks = await logseq.Editor.getPageBlocksTree(pageName);
    if (!blocks || blocks.length === 0) {
        await logseq.Editor.createPage(pageName);
    }

    blocks = await logseq.Editor.getPageBlocksTree(pageName);
    return blocks[blocks.length - 1];
};

let setupEventListener = false;

function clearSearchResults() {
    const search_results = document.getElementById("search-results");
    search_results.innerHTML = "";
}

function filterPages(pageNames, searchValue) {
    return pageNames
        .filter((page) =>
            page.toLowerCase().includes("backlog/" + searchValue.toLowerCase()),
        )
        .filter((page) => !page.includes("/Complete"))
        .sort()
        .slice(0, 10);
}

async function performMove() {
    const search_bar = document.getElementById("search-bar");
    const search_results = document.getElementById("search-results");

    logseq.showMainUI();
    search_bar.value = "";
    clearSearchResults();

    const pages = await logseq.Editor.getAllPages();
    const pageNames = pages.map((page) => page.originalName);

    search_bar.focus();

    if (setupEventListener) {
        return;
    }

    setupEventListener = true;

    const handleKeydown = function (e) {
        if (e.key == "Escape") {
            search_bar.blur();
            logseq.hideMainUI();
        } else if (e.key == "Enter") {
            search_bar.blur();
            logseq.hideMainUI();
            moveItem(filterPages(pageNames, search_bar.value)[0]);
        } else {
            let filtered_pages = filterPages(pageNames, search_bar.value);

            search_results.innerHTML = "";
            filtered_pages.forEach((page) => {
                let div = document.createElement("div");
                div.innerText = page;
                search_results.appendChild(div);
            });
        }
    };

    document.addEventListener("keydown", handleKeydown);
}

async function moveItem(targetPage) {
    console.log("Moving item");

    const block = await window.logseq.Editor.getCurrentBlock();
    const atBlock = await getLastBlock(targetPage);

    // We take the last block and insert these blocks as siblings after it
    logseq.Editor.moveBlock(block.uuid, atBlock.uuid, { sibling: true });

    logseq.UI.showMsg("Moved item to " + targetPage);
}

const main = async () => {
    console.log("Move plugin loaded");
    // Not using "Move block" so as to not clash with logseq-plugin-move-block
    logseq.Editor.registerSlashCommand("Quick move block", async (e) => {
        await performMove();
    });
};

logseq.ready(main).catch(console.error);
