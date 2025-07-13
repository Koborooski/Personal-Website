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
    const itemElement = createImageItemElement();
    lastTier.appendChild(itemElement);

    allTiers.removeChild(lastTier);
}

function createImageItemObject(dataURL, label) {
    return {
        id: 'item-' + Math.random().toString(36).substring(2, 9),
        label: label,
        dataURL: dataURL
    };
}

function createImageItemElement() {
    const itemPreview = document.getElementById("item-preview");
    const newItemClone = itemPreview.cloneNode(true); // Deep clone
    const li = document.createElement('li');

    // Assign a  unique ID 
    newItemClone.id = 'item-' + Math.random().toString(36).substring(2, 9);

    // Remove inline size changes
    newItemClone.style.width = "";
    newItemClone.style.height = "";

    // Remove IDs
    const img = newItemClone.querySelector('img');
    const p = newItemClone.querySelector('p');


    if (img) img.id = '';
    if (p) p.id = '';

    li.appendChild(newItemClone);
    return li;
}

async function bulkItemCreator() {
    const input = document.getElementById("folder-upload");
    const files = Array.from(input.files);

    for (const file of files) {
        if (file.type.startsWith("image/")) {
            await changeItemPreviewImage(file); // wait for it to load
            const item = createImageItemElement(); // now it clones correctly
            addImageItemToQueue(item);
        }
    }
    input.value = "";
}

function addImageItemToQueue() {
    const queue = document.getElementById('queue');
    const newItem = createImageItemElement();
    queue.appendChild(newItem);

    // Clear the label, then reset the preview
    document.getElementById('label-input').value = '';
    changeItemPreviewLabel();

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

function showItemSizeSettings() {
    const settings = document.getElementById("item-height-and-width-container");
    settings.classList.toggle('hidden');
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
    const itemPreviewImage = document.getElementById("item-preview-image");
    const itemPreviewLabel = document.getElementById("item-preview-label");
    const itemRange = document.getElementById("label-img-height-percentage");
    const labelIsOverlapping = document.getElementById("overlap-text-over-image");
    const imgHeight = 100 - itemRange.value;
    const labelHeight = itemRange.value;

    if (labelIsOverlapping.checked){
        itemPreviewImage.style.height = "100%";
    }
    else{
        itemPreviewImage.style.height = imgHeight + "%";
    }
    itemPreviewLabel.style.height = labelHeight + "%";
    
    console.log("Image Height: ", imgHeight, "\nLabel Height", labelHeight);
}

function toggleOverlap() {
    const itemPreviewElement = document.getElementById("item-preview");
    itemPreviewElement.classList.toggle("overlap");
    changeItemImageLabelRange();
}

function setupSpinnerDetection(input) {
    input.prevValue = input.value;

    input.addEventListener('input', () => {
        const currentValue = Number(input.value);

        if (Math.abs(currentValue - input.prevValue) === 1) {changeItemPreviewSize();}

        input.prevValue = currentValue;
    });
}

function changeItemPreviewImage(fileOrInput = document.getElementById('image-upload')) {
    const itemPreviewImage = document.getElementById("item-preview-image");

    return new Promise((resolve) => {
        let file = fileOrInput;

        // If the argument is an input element, extract its file
        if (fileOrInput instanceof HTMLInputElement) {
            file = fileOrInput.files[0];
        }

        if (!file || !file.type.startsWith("image/")) {
            itemPreviewImage.src = "";
            itemPreviewImage.style.display = "none";
            resolve(); // Still resolve, just skip
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {
            itemPreviewImage.src = event.target.result;
            itemPreviewImage.style.display = "block";

            itemPreviewImage.onload = function () {
                resolve(); // resolve only when image visually loads
            };
        };

        reader.readAsDataURL(file);
    });
}

function changeItemPreviewLabel() {
    const itemPreviewLabel = document.getElementById("item-preview-label");
    const labelInput = document.getElementById("label-input");
    itemPreviewLabel.textContent = labelInput.value;
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
                inputs[nextIndex].select();
            }
        });
    });
}

function setupEnterItemAddition() {
    const labelInput = document.getElementById("label-input");

    labelInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addImageItemToQueue();
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
        group: "item-collection",
        onAdd: function (evt) {
            const item = evt.item;
            item.remove();
        }
    });
}

function onStartup(){
    const initialTierLabels = ['S', 'A', 'B', 'C', 'D', 'F'];
    const initialTierColors = ['#8a2e3f', '#d37755', '#dc995d', '#dec575', '#a8b164', '#6f975e']
    const inputs = document.querySelectorAll(".item-size-container input");
    
    initialTierLabels.forEach((tierLabel , i) => {
        createNewTier(tierLabel, initialTierColors[i]);
    });
    inputs.forEach(input => setupSpinnerDetection(input));
    setItemSize();
    setupDraggableTiers();
    setupDraggableQueue();
    setupEnterNavigation();
    setupEnterItemAddition();
    setupDeletionZone();
    setupScrollDrag();
}

document.addEventListener("DOMContentLoaded", () => {
    onStartup();
});
