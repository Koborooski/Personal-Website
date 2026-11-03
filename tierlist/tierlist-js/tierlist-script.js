let itemIdCounter = 0;

function setupDraggableQueue() {
    const queue = document.getElementById('queue');
    Sortable.create(queue, {
        group: "item-collection",
        animation: 150
    });
}

function createNewTier(label = "#N/A", color = "#d3d3d3") {
    const allTiers = document.getElementById("tiers-container");
    if (!allTiers) {
        console.warn('No element with id="tiers-container" found.');
        return;
    }

    // ─── Tier container ────────────────────────────────────────────────
    const newTier = document.createElement("li");
    newTier.className = "tier";
    newTier.style.backgroundColor = color;
    
    // ─── Editable label ──────────────────────────────────────────────
    const tierLabel = document.createElement("textarea");
    tierLabel.className = "tier-label";
    tierLabel.value = label;
    
    // ─── Item list container ────────────────────────────────────────
    const itemContainer = document.createElement("ul");
    itemContainer.className = "item-container";
    
    // ─── Side buttons (handle + color picker) ───────────────────────
    const sideButtonContainer = document.createElement("div");
    sideButtonContainer.className = "side-button-container";
    
    const handle = document.createElement("div");
    handle.className = "handle";
    handle.textContent = "⠿";
    
    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.className = "color-picker";
    colorPicker.value = color;
    
    // I could add a label and hide the colorPicker input, then customize that label
    // But I'd need to create an ID for the color picker, and I don't wanna do that right now

    // live‑update the tier background when user picks a color
    colorPicker.addEventListener("input", (e) => {
        newTier.style.backgroundColor = e.target.value;
    });
    
    // ─── Assemble ─────────────────────────────────────────────────
    newTier.appendChild(tierLabel);
    newTier.appendChild(itemContainer);
    sideButtonContainer.appendChild(handle);
    sideButtonContainer.appendChild(colorPicker);
    newTier.appendChild(sideButtonContainer);
    allTiers.appendChild(newTier);
    

    Sortable.create(itemContainer, {
        animation: 150,
        group: 'item-collection'
    })
}

function removeLastTier(){
    // There's some weird ass glitch that seems to remove an item 
    // If there isn't an item removed alongside a tier
    // The below attempts to monkey fix it.
    const allTiers = document.getElementById('tiers-container');
    const lastTier = allTiers.lastChild;

    // This fixes the glitch
    const itemElement = createImageItemElement("temp", "", "", "69%","1px");
    lastTier.appendChild(itemElement);

    allTiers.removeChild(lastTier);
}

function clearAllTiers() {
    const numOfTiers = document.getElementById("tiers-container").childElementCount;
    for (let i = 0; i < numOfTiers; i++){
        removeLastTier();
    };
}

function createImageItemElement(itemId, itemImg, itemText, itemTextAreaHeight, itemFontSize) {
    const li = document.createElement("li");
    const div = document.createElement("div");
    const img = document.createElement("img");
    const p = document.createElement("p");
    
    div.id = itemId; 
    div.className = "item overlap";
    if (!itemText) {
        div.classList.add("no-label");
    }
    if (!itemImg || itemImg.endsWith(".html")) {
        div.classList.add("no-img");
    }

    div.style.fontSize = itemFontSize;

    if (itemImg) img.src = itemImg;
    img.alt = "Some rando image";

    p.textContent = itemText;
    p.style.height = itemTextAreaHeight;

    console.log("Text:", itemText);
    console.log("Height:", itemTextAreaHeight);
    console.log("Font size:", itemFontSize);


    div.appendChild(img);
    div.appendChild(p);
    li.appendChild(div);

    return li;
}

function addItemToQueue(itemElement) {
    const queue = document.getElementById("queue");
    queue.appendChild(itemElement);
}

function addItemToTier(itemElement, tierElement) {
    const itemContainer = tierElement.querySelector('.item-container');
    itemContainer.appendChild(itemElement);
}

function cloneItemPreviewAsNewItem() {
    const itemPreview = document.getElementById("item-preview");
    const newItemClone = itemPreview.cloneNode(true); // Deep clone
    const li = document.createElement('li');
    const img = newItemClone.querySelector('img');
    const p = newItemClone.querySelector('p');
    console.log(img.src);
    if (itemPreview.classList.contains("no-label") && itemPreview.classList.contains("no-img")) {
        alert("First add an image OR write some text (or both)");
        return
    }
    else if ((img.src === "") && (p.textContent === "")) { 
        alert("First add an image OR write some text (or both)");
        return;
    }
    else if (img.src === "") {
        newItemClone.classList.add("no-img");

        newItemClone.classList.remove("no-label");
    }
    else if (!p.textContent) {
        newItemClone.classList.remove("no-img")
        newItemClone.classList.add("no-label")
    }

    // Assign a  unique ID 
    newItemClone.id = 'item-' + itemIdCounter;
    itemIdCounter += 1;

    // Remove inline size changes
    newItemClone.style.width = "";
    newItemClone.style.height = "";
    
    // Remove IDs
    if (img) img.id = '';
    if (p) p.id = '';

    li.appendChild(newItemClone);
    return li;
}

function bulkItemCreator() {
    const input = document.getElementById("bulk-file-upload");
    const files = Array.from(input.files);

    for (const file of files) {
        if (file.type.startsWith("image/")) {
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const item = createImageItemElement(("item-" + itemIdCounter), event.target.result, "", "0%", "0px");
                itemIdCounter++;
                addItemToQueue(item);
            }
            reader.readAsDataURL(file);
        }
    }
    input.value = "";
}

function addPreviewCloneToQueue() {
    const queue = document.getElementById('queue');
    const newItem = cloneItemPreviewAsNewItem();
    queue.appendChild(newItem);

    // Clear the label, then reset the preview
    document.getElementById('label-input').value = '';
    changeItemPreviewLabel();

}

function clearQueue() {
    const queueElement = document.getElementById("queue");
    queueElement.replaceChildren();
}

function setItemSize() {
    const itemWidth = document.getElementById("item-width");
    const itemHeight = document.getElementById("item-height");
    console.log("Setting item size");
    
    for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
            if (rule.selectorText === '.item') {
                rule.style.width = itemWidth.value + "px";
                rule.style.height = itemHeight.value + "px";
                break;
            }
        }
    }
    for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
            if (rule.selectorText === '.tier') {
                rule.style.minHeight = (Number(itemHeight.value) + 10) + "px";
                break
            }
        }
    }
    for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
            if (rule.selectorText === '#queue') {
                rule.style.minHeight = (Number(itemHeight.value) + 10) + "px";
                break
            }
        }
    }
    changeItemPreviewSize();
    
}

function changeItemPreviewSize() {
    const itemWidthElement = document.getElementById("item-width");
    const itemHeightElement = document.getElementById("item-height");
    const itemPreviewElement = document.getElementById("item-preview");
    
    // Parse and clamp width
    let width = Number(itemWidthElement.value);
    const widthMin = Number(itemWidthElement.min) || 0;
    const widthMax = Number(itemWidthElement.max) || Infinity;
    if (width < widthMin) width = widthMin;
    if (width > widthMax) width = widthMax;
    itemWidthElement.value = width;
    
    // Parse and clamp height
    let height = Number(itemHeightElement.value);
    const heightMin = Number(itemHeightElement.min) || 0;
    const heightMax = Number(itemHeightElement.max) || Infinity;
    if (height < heightMin) height = heightMin;
    if (height > heightMax) height = heightMax;
    itemHeightElement.value = height;
    
    // Apply styles
    itemPreviewElement.style.width = width + "px";
    itemPreviewElement.style.height = height + "px";
    
    console.log("Changing Elements:", width, height);
}
    
function changeItemImageLabelRange() {
    const itemPreviewLabel = document.getElementById("item-preview-label");
    const itemRange = document.getElementById("label-img-height-percentage");
    const imgHeight = 100 - itemRange.value;
    const labelHeight = itemRange.value;

    itemPreviewLabel.style.height = labelHeight + "%";
    console.log("Label Height", labelHeight);
}

function changeItemPreviewFontSize() {
    const itemFontSizeElement = document.getElementById("font-size-option");
    const itemPreviewElement = document.getElementById('item-preview');
    
    // Parse and clamp font size
    let fontSize = Number(itemFontSizeElement.value);
    const fontMin = Number(itemFontSizeElement.min) || 0;
    const fontMax = Number(itemFontSizeElement.max) || Infinity;
    if (fontSize < fontMin) {fontSize = fontMin};
    if (fontSize > fontMax) {fontSize = fontMax};
    itemFontSizeElement.value = fontSize;
    console.log("I shall change it to", fontSize);
    itemPreviewElement.style.fontSize = fontSize + "px";
}


function changeItemPreviewImage(input = document.getElementById('image-upload')) {
    const itemPreview = document.getElementById("item-preview");
    const itemPreviewImage = document.getElementById("item-preview-image");
    console.log("Starting the change")
    if (!input || !input.files || input.files.length === 0) {
        console.log("No file existed");
        itemPreviewImage.src = "";
        itemPreview.classList.add("no-img");
        return;
    }

    const file = input.files[0];

    if (!file.type.startsWith("image/")) {
        console.warn("Selected file is not an image.");
        itemPreviewImage.removeAttribute('src');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        console.log("We had a thingy ya feel")
        itemPreviewImage.src = event.target.result;
        itemPreview.classList.remove("no-img");
    };

    reader.readAsDataURL(file);
}


function changeItemPreviewLabel() {
    const itemPreviewLabel = document.getElementById("item-preview-label");
    const itemPreview = document.getElementById("item-preview");
    const labelInput = document.getElementById("label-input");
    itemPreviewLabel.textContent = labelInput.value;

    if (labelInput.value !== "") {
        itemPreview.classList.remove("no-label");
    }
    else {
        itemPreview.classList.add("no-label");
    }
}

function showItemSizeSettings() {
    const itemSizeSettings = document.getElementById("item-height-and-width-container");
    itemSizeSettings.classList.toggle("hidden");
    
}

function setupTitleEnterCommand() {
    const title = document.getElementById("tierlist-title");
    title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.querySelector(".tier .tier-label")?.focus();
        }
    });
}

function setupEnterNavigation() {
    const inputs = document.querySelectorAll("#item-height-and-width-container input");
    
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                changeItemPreviewSize();
                const nextIndex = (index + 1) % inputs.length;
                inputs[nextIndex].focus();
            }
        });
        input.addEventListener('focus', (e) => {
            e.preventDefault();
            input.select();
        });
    });
}

function setupTierNavigation() {
    const inputs = document.querySelectorAll("#tiers-container .tier-label");
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                let movement = 1;
                if (e.shiftKey) {movement = -1};    
                e.preventDefault();
                changeItemPreviewSize();
                let nextIndex = (index + movement) % inputs.length;
                if (nextIndex < 0) {nextIndex = inputs.length - 1};
                inputs[nextIndex].focus();
            }
        });
        input.addEventListener('focus', (e) => {
            e.preventDefault();
            input.select();
        });
    });
}

function setupFontSizeSelector() {
    const fontSizeElement = document.getElementById('font-size-option');

    fontSizeElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            fontSizeElement.select();
        }
    });

    fontSizeElement.addEventListener('focus', (e) => {
        e.preventDefault();
        fontSizeElement.select();
    });
}

function setupEnterItemAddition() {
    const labelInput = document.getElementById("label-input");

    labelInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPreviewCloneToQueue();
        }
    })
}

function setupDraggableTiers() {
    Sortable.create(document.getElementById("tiers-container"), {
        animation: 150,
        handle: ".handle",
        group: "tier"
    });
}

function setupScrollDrag() {
    // -1 = up, 1 = down, 0 = no scroll
    let scrollDirection = 0;
    const scrollThreshold = 50;
    const scrollSpeed = 10;

    function onDragOver(e) {
        if (e.clientY < scrollThreshold) {
            scrollDirection = -1;
        } else if (window.innerHeight - e.clientY < scrollThreshold) {
            scrollDirection = 1;
        } else {
            scrollDirection = 0;
        }
    }

    function smoothScroll() {
        if (scrollDirection !== 0) {
            window.scrollBy(0, scrollDirection * scrollSpeed);
        }
        requestAnimationFrame(smoothScroll);
    }

    document.addEventListener("dragover", onDragOver);
    requestAnimationFrame(smoothScroll);
}

function setupDeletionZone() {
    const deletionZone = document.getElementById("deletion-zone");

    Sortable.create(deletionZone, {
        animation: 0,
        group: {
            put: ["item-collection", "tier"]
        },
        onAdd: function (evt) {
            const item = evt.item;
            item.remove();
        }
    });
}

function getTierListState() {
    const titleElement = document.getElementById('tierlist-title');
    const itemPreviewElement = document.getElementById('item-preview');

    // Each unique image is stored once; items refer to it by index
    const images = [];
    const imageIndex = new Map();   // image data -> its index in `images`

    const readItem = item => {
        const img = item.querySelector('img');
        const text = item.querySelector('p');
        const src = img?.getAttribute('src') || null;

        let itemImgRef = null;
        if (src) {
            if (!imageIndex.has(src)) {
                imageIndex.set(src, images.length);
                images.push(src);
            }
            itemImgRef = imageIndex.get(src);
        }

        return {
            itemID: item.id,
            itemImgRef,
            itemText: text?.textContent || "",
            itemTextAreaHeight: text?.style.height || "",
            itemFontSize: item.style.fontSize
        };
    };

    const allTiers = [...document.querySelectorAll('.tier')].map(tier => ({
        tierLabel: tier.querySelector('.tier-label')?.value || "",
        tierColor: tier.querySelector('.color-picker').value,
        tierItems: [...tier.querySelectorAll('.item')].map(readItem)
    }));
    const queue = [...document.querySelectorAll('#queue .item')].map(readItem);

    return {
        tierListTitle: titleElement?.value || "Silly Goose",
        baseItemSize: { width: itemPreviewElement.style.width, height: itemPreviewElement.style.height },
        idCounter: itemIdCounter,
        images,
        allTiers,
        queue
    };
}

function downloadJson(data, filename) {
    const json = JSON.stringify(data, null, 4);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// This will include items within tiers, as if someone already ranked it.
function exportPersonalJsonFile() {
    const state = getTierListState();
    downloadJson(state, 'My ' + state.tierListTitle + ' Tierlist.json');
}

// This will pull all items into the queue, unranked, in the order they were created.
function exportTemplateJsonFile() {
    const state = getTierListState();

    // Gather every item: the ones in tiers plus the ones already in the queue
    const allItems = [
        ...state.allTiers.flatMap(tier => tier.tierItems),
        ...state.queue
    ];

    // Sort by creation order (item-0, item-1, ...)
    const idNumber = item => parseInt(item.itemID.replace("item-", ""), 10) || 0;
    allItems.sort((a, b) => idNumber(a) - idNumber(b));

    // Empty the tiers, put everything in the queue
    state.allTiers.forEach(tier => tier.tierItems = []);
    state.queue = allItems;

    downloadJson(state, state.tierListTitle + ' Tierlist Template.json');
}

function loadTierListState(data) {
    clearQueue();
    clearAllTiers();

    document.getElementById('tierlist-title').value = data.tierListTitle;
    document.getElementById("item-width").value = parseInt(data.baseItemSize.width);
    document.getElementById("item-height").value = parseInt(data.baseItemSize.height);
    setItemSize();
    itemIdCounter = data.idCounter;

    const makeItem = item => createImageItemElement(
        item.itemID,
        item.itemImg ?? data.images?.[item.itemImgRef] ?? null,
        item.itemText, item.itemTextAreaHeight, item.itemFontSize
    );
    data.allTiers.forEach(tier => {
        createNewTier(tier.tierLabel, toHexColor(tier.tierColor));
        const newTier = document.getElementById("tiers-container").lastChild;
        tier.tierItems.forEach(item => addItemToTier(makeItem(item), newTier));
    });

    data.queue.forEach(item => addItemToQueue(makeItem(item)));

    // The old tier labels were deleted, so hook Enter navigation up to the new ones
    setupTierNavigation();
}

// Older "Save For Self" files stored colors as "rgb(r, g, b)", which color pickers can't use
function toHexColor(color) {
    const match = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(color);
    if (!match) return color;
    return "#" + match.slice(1).map(n => Number(n).toString(16).padStart(2, "0")).join("");
}

function importJsonFile() {
    const jsonFileElement = document.getElementById("json-upload");
    const file = jsonFileElement.files[0];
    if (!file) {
        alert("Please select a JSON file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            loadTierListState(JSON.parse(e.target.result));
        } catch (err) {
            console.error(err);
            alert("That file couldn't be loaded. Is it a tier list JSON file?");
        }
    };
    reader.readAsText(file);

    jsonFileElement.value = "";
}

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('tierlist-db', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('saves');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveState(state) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('saves', 'readwrite');
        tx.objectStore('saves').put(state, 'current');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

async function loadState() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const req = db.transaction('saves').objectStore('saves').get('current');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

let saveTimer;
function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveState(getTierListState()).catch(console.error), 500);
}

function startAutosave() {
    // Catches drags, added/removed items and tiers, and color changes
    new MutationObserver(scheduleSave).observe(
        document.getElementById('all-item-holders-container'),
        { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] }
    );
    // Catches typing in the title and tier labels (typing doesn't change the DOM)
    document.addEventListener('input', scheduleSave);
}

async function onStartup() {
    // Restore the last session if there is one, otherwise make the default tiers
    const saved = await loadState().catch(err => {
        console.error("Couldn't load saved tier list:", err);
        return null;
    });

    if (saved) {
        loadTierListState(saved);   // this already runs setupTierNavigation()
    } else {
        const initialTierLabels = ['S', 'A', 'B', 'C', 'D', 'F'];
        const initialTierColors = ['#8a2e3f', '#d37755', '#dc995d', '#dec575', '#a8b164', '#6f975e'];
        initialTierLabels.forEach((tierLabel, i) => {
            createNewTier(tierLabel, initialTierColors[i]);
        });
        setupTierNavigation();
    }

    changeItemPreviewFontSize();
    changeItemPreviewSize();
    changeItemImageLabelRange();
    setupTitleEnterCommand();
    setItemSize();
    setupDraggableTiers();
    setupDraggableQueue();
    setupEnterNavigation();
    setupEnterItemAddition();
    setupDeletionZone();
    setupScrollDrag();
    setupFontSizeSelector();

    // Start watching for changes only after everything is built
    startAutosave();
    navigator.storage?.persist?.();
}

document.addEventListener("DOMContentLoaded", () => {
    onStartup();
});


