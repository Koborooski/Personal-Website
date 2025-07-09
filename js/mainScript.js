function addDraggableToQueue() {
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

    // ─── Tier wrapper ────────────────────────────────────────────────
    const newTier = document.createElement("li");
    newTier.className = "tier";
    newTier.style.backgroundColor = color; // optional default
    
    // ─── Editable label ──────────────────────────────────────────────
    const tierLabel = document.createElement("div");
    tierLabel.className = "tier-label";
    tierLabel.contentEditable = true;
    tierLabel.textContent = label;
    
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
    
    // live‑update the tier background when user picks a colour
    colorPicker.addEventListener("input", (e) => {
        newTier.style.backgroundColor = e.target.value;
    });
    
    // ─── Assemble the DOM ────────────────────────────────────────────
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
    const itemObj = createImageItemObject(null, 'blank');
    const itemElement = createImageItemElement(itemObj);
    lastTier.appendChild(itemElement);

    allTiers.removeChild(lastTier);
}

function onStartup(){
    const initialTierLabels = ['S', 'A', 'B', 'C', 'D', 'F'];
    const initialTierColors = ['#8a2e3f', '#d37755', '#dc995d', '#dec575', '#a8b164', '#6f975e']

    initialTierLabels.forEach((tierLabel , i) => {
        createNewTier(tierLabel, initialTierColors[i]);
    });

    addDraggableToQueue()
}

function createImageItemObject(dataURL, label) {
    return {
        id: 'item-' + Math.random().toString(36).substring(2, 9),
        label: label,
        dataURL: dataURL
    };
}

function createImageItemElement(itemObj) {
    const li = document.createElement('li');
    
    const item = document.createElement('div');
    item.className = 'item';
    item.id = itemObj.id;
    item._itemObj = itemObj;
    const img = document.createElement('img');    
    
    if(itemObj.dataURL){
        console.log("This shit had a dataURL");
        img.src = itemObj.dataURL;
    }
    else {
        console.log("This shit had no dataURL")
    }

    const caption = document.createElement('span');
    caption.textContent = itemObj.label;
    
    item.appendChild(img);
    if (itemObj.label) item.appendChild(caption);
    li.appendChild(item); 
    
    return li;
}


function addImageItemToQueue() {
    const queue = document.getElementById('queue');
    const fileInput = document.getElementById('imageUpload');
    const labelInput = document.getElementById('imageLabel');

    const file = fileInput.files[0];
    const label = labelInput.value.trim();


    //If nothing is selected, do nothing
    if (!file && label === "") {
        console.log("This shit had nothin");
        return;
    }
    
 
    else if (!file) {
        const itemObj = createImageItemObject(null, label);
        const itemElement = createImageItemElement(itemObj);
        queue.appendChild(itemElement);
        console.log(itemObj);
    }

    else {
        const reader = new FileReader();

        reader.onload = function(event) {
            const dataURL = event.target.result;
            const itemObj = createImageItemObject(dataURL, label);
            const itemElement = createImageItemElement(itemObj);
            queue.appendChild(itemElement);
            console.log(itemObj);
        };
        reader.readAsDataURL(file);
    }
}


function readAllTiers() {
    const allTiers = document.querySelectorAll('.tier');

    allTiers.forEach((tier, tierIndex) => {
        console.log(`Tier ${tierIndex}:`);

        const items = tier.querySelectorAll('li');

        items.forEach((li, itemIndex) => {
            const itemDiv = li.querySelector('.item');
            console.log(itemDiv);
            if (itemDiv && itemDiv._itemObj) {
                console.log(`  Item ${itemIndex}:`, itemDiv._itemObj);
            } else {
                console.log(`  Item ${itemIndex}: (missing or no _itemObj)`);
            }
        });

        if (items.length === 0) {
            console.log(`  (no items)`);
        }
    });
}




// Not really working right now
function downloadAsJSON() {
}

// Not really working right now
function importJsonFile() {
    return
}

// Not really working right now
function ExportJsonFile() {
    return
}

// Only call once, not every time you add a tier
Sortable.create(document.getElementById("tiers-container"), {
    animation: 150,
    handle: ".handle",
    group: "tier"
});



document.addEventListener("DOMContentLoaded", () => {
    onStartup();
});
