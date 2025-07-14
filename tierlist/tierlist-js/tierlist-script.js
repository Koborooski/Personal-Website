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

    img.src = itemImg;
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
    const firstTier = document.querySelector(".tier").querySelector('.tier-label');

    title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            firstTier.focus();
        }
    })
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
// This will include items within tiers, as if someone already ranked it.
function exportPersonalJsonFile() {
    const titleElement = document.getElementById('tierlist-title');
    const itemPreviewElement = document.getElementById('item-preview');
    const queueItems = document.getElementById('queue').querySelectorAll('.item');
    const queueData = [];
    const tiers = document.querySelectorAll('.tier');
    const tiersData = [];

    tiers.forEach(tier => {
        const tierLabelElement = tier.querySelector('.tier-label');
        const tierItems = tier.querySelectorAll('.item');
        const itemData = [];

        tierItems.forEach(item => {
            const img = item.querySelector('img');
            const text = item.querySelector('p');

            itemData.push({
                itemID: item.id,
                itemImg: img?.src || null,
                itemText: text?.textContent || "",
                itemTextAreaHeight: text.style.height,
                itemFontSize: item.style.fontSize
            });
        });

        tiersData.push({
        tierLabel: tierLabelElement?.value || "",
        tierColor: getComputedStyle(tier).backgroundColor,
        tierItems: itemData
        });
    });

    queueItems.forEach(item => {
        const img = item.querySelector('img');
        const text = item.querySelector('p');

        queueData.push({
            itemID: item.id,
            itemImg: img?.src || null,
            itemText: text?.value || "",
            itemTextAreaHeight: text.style.height,
            itemFontSize: item.style.fontSize
        });
    });

    const myShiiiYaFeel = { 
        tierListTitle: titleElement?.value || "Silly Goose",
        baseItemSize: {width: itemPreviewElement.style.width, height: itemPreviewElement.style.height},
        idCounter: itemIdCounter,
        allTiers: tiersData,
        queue: queueData
    };
    const json = JSON.stringify(myShiiiYaFeel, null, 4);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'My ' + (titleElement?.value || "Silly Goose") + ' Tierlist.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
// This will pull all items and only keep track of their ID. 
function exportTemplateJsonFile() {
    const titleElement = document.getElementById('tierlist-title');
    const itemPreviewElement = document.getElementById('item-preview');
    const items = document.querySelectorAll('.item');
    const itemData = [];
    const tiers = document.querySelectorAll('.tier');
    const tiersData = [];

    tiers.forEach(tier => {
        const tierLabelElement = tier.querySelector('.tier-label');

        tiersData.push({
        tierLabel: tierLabelElement?.value || "",
        tierColor: tier.querySelector(".color-picker").value,
        tierItems: []
        });
    });

    items.forEach(item => {
        if (item.id === "item-preview") return;

        const img = item.querySelector('img');
        const text = item.querySelector('p');

        itemData.push({
            itemID: item.id,
            itemImg: img?.src || null,
            itemText: text?.textContent || "",
            itemTextAreaHeight: text.style.height,
            itemFontSize: item.style.fontSize
        });
    });
    itemData.sort((a, b) => {
        const idA = parseInt(a.itemID.replace("item-", ""), 10);
        const idB = parseInt(b.itemID.replace("item-", ""), 10);
        return idA - idB;
    });
    const myShiiiYaFeel = { 
        tierListTitle: titleElement?.value || "Silly Goose",
        baseItemSize: {width: itemPreviewElement.style.width, height: itemPreviewElement.style.height},
        idCounter: itemIdCounter,
        allTiers: tiersData,
        queue: itemData
    };
    const json = JSON.stringify(myShiiiYaFeel, null, 4);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (titleElement?.value || "Silly Goose") + ' Tierlist Template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importJsonFile() {
    const titleElement = document.getElementById('tierlist-title');
    const itemWidthElement = document.getElementById("item-width");
    const itemHeightElement = document.getElementById("item-height");
    const jsonFileElement = document.getElementById("json-upload");

    const file = jsonFileElement.files[0];
    if (!file) {
        alert("Please select a JSON file.");
        return;
    }
    clearQueue();
    clearAllTiers();

    const reader = new FileReader();

    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        const allTiers = data.allTiers;
        const queue = data.queue;

        titleElement.value = data.tierListTitle;
        itemWidthElement.value = parseInt(data.baseItemSize.width);
        itemHeightElement.value = parseInt(data.baseItemSize.height);
        setItemSize();
        itemIdCounter = data.idCounter;

        allTiers.forEach(tier => {
            const allItems = tier.tierItems;
            console.log("Making a new tier");
            createNewTier(tier.tierLabel, tier.tierColor);
            const newTier = document.getElementById("tiers-container").lastChild;
            allItems.forEach(item => {
                const itemElement = createImageItemElement(item.itemID, item.itemImg, item.itemText, item.itemTextAreaHeight, item.itemFontSize);
                addItemToTier(itemElement, newTier);
            });
        });

        queue.forEach(item => {
            const itemElement = createImageItemElement(item.itemID, item.itemImg, item.itemText, item.itemTextAreaHeight, item.itemFontSize);
            addItemToQueue(itemElement);
        });

    }

    reader.readAsText(file)
    
    jsonFileElement.value = "";

}

function onStartup(){
    const initialTierLabels = ['S', 'A', 'B', 'C', 'D', 'F'];
    const initialTierColors = ['#8a2e3f', '#d37755', '#dc995d', '#dec575', '#a8b164', '#6f975e']
    
    initialTierLabels.forEach((tierLabel , i) => {
        createNewTier(tierLabel, initialTierColors[i]);
    });
    changeItemPreviewFontSize();
    changeItemPreviewSize();
    changeItemImageLabelRange();
    setupTitleEnterCommand();
    setupTierNavigation();
    setItemSize();
    setupDraggableTiers();
    setupDraggableQueue();
    setupEnterNavigation();
    setupEnterItemAddition();
    setupDeletionZone();
    setupScrollDrag();
    setupFontSizeSelector();
}

document.addEventListener("DOMContentLoaded", () => {
    onStartup();
});



