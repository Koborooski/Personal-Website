let itemIdCounter = 0;

// Reads a number input, clamps it to its min/max, writes the clamped value back, and returns it
function clampInput(input) {
    let value = Number(input.value);
    if (Number.isNaN(value)) value = Number(input.defaultValue) || 0;
    const min = input.min === "" ? -Infinity : Number(input.min);
    const max = input.max === "" ? Infinity : Number(input.max);
    value = Math.min(Math.max(value, min), max);
    input.value = value;
    return value;
}

// Shared by every Sortable list.
// forceFallback: drag with mouse events instead of the browser's native drag-and-drop,
//   which blocks the scroll wheel while dragging.
// fallbackTolerance: the mouse must move a few pixels before a drag starts, so clicks
//   and double-clicks on items aren't mistaken for drags.
// scroll: false: Sortable's own fixed-speed auto-scroll is off; setupScrollDrag handles it.
const DRAG_OPTIONS = {
    forceFallback: true,
    fallbackTolerance: 3,
    scroll: false,
    // Clear any text the mouse-down may already have started selecting
    onStart: () => window.getSelection()?.removeAllRanges()
};

function setupDraggableQueue() {
    const queue = document.getElementById('queue');
    Sortable.create(queue, {
        group: "item-collection",
        animation: 150,
        ...DRAG_OPTIONS
    });
}

function createNewTier(label = "#N/A", color = "#d3d3d3") {
    const allTiers = document.getElementById("tiers-container");
    if (!allTiers) {
        console.warn('No element with id="tiers-container" found.');
        return null;
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
        group: 'item-collection',
        ...DRAG_OPTIONS
    });

    return newTier;
}

// Removes the bottom tier. Its items go back to the queue instead of being deleted.
function removeLastTier() {
    const lastTier = document.getElementById('tiers-container').lastElementChild;
    if (!lastTier) return;

    const queue = document.getElementById('queue');
    lastTier.querySelectorAll('.item-container > li').forEach(li => queue.appendChild(li));
    lastTier.remove();
}

// Deletes every tier along with its items (used when loading a saved list)
function clearAllTiers() {
    document.getElementById("tiers-container").replaceChildren();
}

function createImageItemElement(itemId, itemImg, itemText, itemTextAreaHeight, itemFontSize) {
    const li = document.createElement("li");
    const div = document.createElement("div");
    const img = document.createElement("img");
    const p = document.createElement("p");

    // Older saves could store the page's own URL for items without an image
    const hasImg = Boolean(itemImg) && !itemImg.endsWith(".html");

    div.id = itemId;
    div.className = "item overlap";
    if (!itemText) div.classList.add("no-label");
    if (!hasImg) div.classList.add("no-img");

    div.style.fontSize = itemFontSize;

    if (hasImg) img.src = itemImg;
    img.alt = itemText || "";

    p.textContent = itemText ?? "";
    p.style.height = itemTextAreaHeight;

    div.appendChild(img);
    div.appendChild(p);
    li.appendChild(div);

    return li;
}

function addItemToQueue(itemElement) {
    document.getElementById("queue").appendChild(itemElement);
}

function addItemToTier(itemElement, tierElement) {
    tierElement.querySelector('.item-container').appendChild(itemElement);
}

// Returns a new <li> copy of the preview, or null if the preview is empty
function cloneItemPreviewAsNewItem() {
    const itemPreview = document.getElementById("item-preview");
    const hasImg = itemPreview.querySelector('img').hasAttribute('src');
    const hasText = itemPreview.querySelector('p').textContent !== "";

    if (!hasImg && !hasText) {
        alert("First add an image OR write some text (or both)");
        return null;
    }

    const newItemClone = itemPreview.cloneNode(true); // Deep clone
    newItemClone.classList.toggle("no-img", !hasImg);
    newItemClone.classList.toggle("no-label", !hasText);

    // Assign a unique ID
    newItemClone.id = 'item-' + itemIdCounter;
    itemIdCounter += 1;

    // Remove inline size changes so the item follows the shared item size
    newItemClone.style.width = "";
    newItemClone.style.height = "";

    const img = newItemClone.querySelector('img');
    const p = newItemClone.querySelector('p');
    img.removeAttribute('id');
    p.removeAttribute('id');
    img.alt = p.textContent;

    const li = document.createElement('li');
    li.appendChild(newItemClone);
    return li;
}

// ─── Image files ─────────────────────────────────────────────────────

// Images bigger than this (in pixels, on their longest side) get shrunk on upload.
// Items max out at 500px, so this keeps them sharp while keeping saves small.
const MAX_IMAGE_SIDE = 800;

const isImageFile = file => file.type.startsWith("image/");

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Returns the image as a data URL, shrunk and re-encoded as WebP when that makes it smaller.
// GIFs and SVGs are kept as-is (a canvas would stop GIFs animating and make SVGs blurry).
async function imageFileToDataURL(file) {
    const original = await readFileAsDataURL(file);
    if (file.type === "image/gif" || file.type === "image/svg+xml") return original;

    let img;
    try {
        img = await loadImage(original);
    } catch {
        return original;
    }

    const longestSide = Math.max(img.naturalWidth, img.naturalHeight);
    if (!longestSide) return original;
    const scale = Math.min(1, MAX_IMAGE_SIDE / longestSide);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

    const shrunk = canvas.toDataURL("image/webp", 0.85);
    return shrunk.length < original.length ? shrunk : original;
}

// Turns image files into image-only items, appended to `container` (the queue or a tier's item list)
async function addImageFilesAsItems(files, container = document.getElementById("queue")) {
    const images = files.filter(isImageFile);
    const dataUrls = await Promise.all(images.map(file =>
        imageFileToDataURL(file).catch(err => {
            console.error("Couldn't read image:", file.name, err);
            return null;
        })
    ));

    // Added after all are read, so they keep the order they were picked in
    for (const src of dataUrls) {
        if (!src) continue;
        const item = createImageItemElement(("item-" + itemIdCounter), src, "", "0%", "0px");
        itemIdCounter++;
        container.appendChild(item);
    }
}

function bulkItemCreator() {
    const input = document.getElementById("bulk-file-upload");
    const files = Array.from(input.files);
    input.value = "";
    addImageFilesAsItems(files);
}

// Paste an image anywhere to put it in the Create Item preview,
// or drop image files onto the queue, a tier, or the item preview
function setupFileDropAndPaste() {
    document.addEventListener("paste", (e) => {
        const image = [...(e.clipboardData?.files ?? [])].find(isImageFile);
        if (!image) return;   // normal text pasting is left alone
        e.preventDefault();
        setPreviewImageFromFile(image);
    });

    const hasFiles = e => e.dataTransfer?.types.includes("Files");

    // Without this, dropping a file makes the browser open it and leave the page
    document.addEventListener("dragover", (e) => {
        if (hasFiles(e)) e.preventDefault();
    });

    document.addEventListener("drop", (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        const files = [...e.dataTransfer.files].filter(isImageFile);
        if (!files.length) return;

        if (e.target.closest?.("#item-preview")) {
            setPreviewImageFromFile(files[0]);
            return;
        }
        const container = e.target.closest?.(".item-container, #queue") ?? document.getElementById("queue");
        addImageFilesAsItems(files, container);
    });
}

// ─── Adding and editing items ───────────────────────────────────────

let editingItem = null;   // the item being edited in the preview, if any

// "Add Item!" button (or Enter in the text box). In edit mode, it saves changes instead.
function submitItemPreview() {
    const newItem = cloneItemPreviewAsNewItem();
    if (!newItem) return;

    if (editingItem?.isConnected) {
        newItem.firstElementChild.id = editingItem.id;   // keep its place in creation order
        editingItem.closest("li").replaceWith(newItem);
        stopEditingItem();
        return;
    }

    // Not editing (or the item being edited was deleted meanwhile): add it as a new item
    stopEditingItem();
    addItemToQueue(newItem);

    // Clear the label, then reset the preview
    document.getElementById('label-input').value = '';
    changeItemPreviewLabel();
}

function startEditingItem(item) {
    stopEditingItem();
    editingItem = item;
    item.classList.add("editing");

    const img = item.querySelector("img");
    const p = item.querySelector("p");

    setPreviewImage(img.getAttribute("src"));

    const labelInput = document.getElementById("label-input");
    labelInput.value = p.textContent;
    changeItemPreviewLabel();

    // Image-only items (from bulk/paste/drop) have no font size or text height, so keep the current ones
    const fontSize = parseInt(item.style.fontSize);
    if (fontSize) {
        document.getElementById("font-size-option").value = fontSize;
        changeItemPreviewFontSize();
    }
    const autosizeBox = document.getElementById("autosize-label");
    const labelHeight = parseInt(p.style.height);
    if (p.style.height === "auto") {
        autosizeBox.checked = true;
        changeItemImageLabelRange();
    } else if (labelHeight) {
        autosizeBox.checked = false;
        document.getElementById("label-img-height-percentage").value = labelHeight;
        changeItemImageLabelRange();
    }

    document.getElementById("add-item-button").textContent = "Save Changes";
    document.getElementById("cancel-edit-button").classList.remove("hidden");

    document.getElementById("create-item-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
    labelInput.focus({ preventScroll: true });
}

function stopEditingItem() {
    if (!editingItem) return;
    editingItem.classList.remove("editing");
    editingItem = null;

    document.getElementById("add-item-button").textContent = "Add Item!";
    document.getElementById("cancel-edit-button").classList.add("hidden");

    // Empty the preview so the edited item's content isn't left behind
    document.getElementById("label-input").value = "";
    changeItemPreviewLabel();
    setPreviewImage(null);
}

function setupItemEditing() {
    document.getElementById("all-item-holders-container").addEventListener("dblclick", (e) => {
        const item = e.target.closest(".item");
        if (item) startEditingItem(item);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") stopEditingItem();
    });
}

// ─── Double right-click on an item to delete it ────────────────────

const DOUBLE_RIGHT_CLICK_MS = 400;   // max gap between the two right-clicks

// Only items on the board are affected: not tiers, and not the Create Item preview
function setupDoubleRightClickDelete() {
    const container = document.getElementById("all-item-holders-container");
    let lastItem = null;
    let lastTime = 0;

    // No browser right-click menu on items
    container.addEventListener("contextmenu", (e) => {
        if (e.target.closest(".item")) e.preventDefault();
    });

    container.addEventListener("pointerdown", (e) => {
        if (e.button !== 2) return;
        const item = e.target.closest(".item");
        if (!item) return;

        const now = performance.now();
        if (item === lastItem && now - lastTime <= DOUBLE_RIGHT_CLICK_MS) {
            lastItem = null;
            if (editingItem === item) stopEditingItem();
            item.closest("li").remove();
            return;
        }
        lastItem = item;
        lastTime = now;
    });
}

function clearQueue() {
    document.getElementById("queue").replaceChildren();
}

function confirmClearQueue() {
    const count = document.getElementById("queue").childElementCount;
    if (count === 0) return;
    if (confirm(`Delete all ${count} item${count === 1 ? "" : "s"} in the queue?`)) {
        clearQueue();
    }
}

function startNewTierList() {
    if (!confirm("Start a new tier list? This deletes the current title, tiers and items.")) return;

    stopEditingItem();
    clearAllTiers();
    clearQueue();
    document.getElementById("tierlist-title").value = "";
    itemIdCounter = 0;

    // Back to the default item size: the inputs' starting values in the HTML (80×80)
    for (const id of ["item-width", "item-height"]) {
        const input = document.getElementById(id);
        input.value = input.defaultValue;
    }
    setItemSize();

    createDefaultTiers();
    scheduleSave();
}

// Item size lives in CSS variables, so every item, tier and the queue update together
function setItemSize() {
    const width = clampInput(document.getElementById("item-width"));
    const height = clampInput(document.getElementById("item-height"));
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--item-w', width + "px");
    rootStyle.setProperty('--item-h', height + "px");
}

// Sets the preview's text box height from the slider, or fits it to the text when "Autosize" is checked
function changeItemImageLabelRange() {
    const itemPreviewLabel = document.getElementById("item-preview-label");
    const itemRange = document.getElementById("label-img-height-percentage");
    const autosize = document.getElementById("autosize-label").checked;

    itemRange.disabled = autosize;
    itemPreviewLabel.style.height = autosize ? "auto" : itemRange.value + "%";
}

// Sets every item on the board (tiers and queue) to the Font Size option's value
function applyFontSizeToAllItems() {
    const fontSize = clampInput(document.getElementById("font-size-option")) + "px";
    const items = document.querySelectorAll("#all-item-holders-container .item");
    if (!items.length) return;
    if (!confirm(`Set all ${items.length} item${items.length === 1 ? "" : "s"} to font size ${fontSize}?`)) return;
    items.forEach(item => { item.style.fontSize = fontSize; });
}

function changeItemPreviewFontSize() {
    const fontSize = clampInput(document.getElementById("font-size-option"));
    document.getElementById('item-preview').style.fontSize = fontSize + "px";
}

// Shows `src` in the preview, or removes the preview's image when `src` is empty
function setPreviewImage(src) {
    const itemPreview = document.getElementById("item-preview");
    const itemPreviewImage = document.getElementById("item-preview-image");

    if (src) {
        itemPreviewImage.src = src;
    } else {
        itemPreviewImage.removeAttribute('src');
    }
    itemPreview.classList.toggle("no-img", !src);
    document.getElementById("remove-image-button").classList.toggle("hidden", !src);
}

async function setPreviewImageFromFile(file) {
    if (!file || !isImageFile(file)) {
        if (file) console.warn("Selected file is not an image.");
        setPreviewImage(null);
        return;
    }
    try {
        setPreviewImage(await imageFileToDataURL(file));
    } catch (err) {
        console.error("Couldn't read image:", err);
        setPreviewImage(null);
    }
}

function changeItemPreviewImage() {
    const input = document.getElementById('image-upload');
    const file = input.files?.[0];
    input.value = "";   // so picking the same file again still triggers a change
    if (file) setPreviewImageFromFile(file);
}

function changeItemPreviewLabel() {
    const itemPreviewLabel = document.getElementById("item-preview-label");
    const itemPreview = document.getElementById("item-preview");
    const labelInput = document.getElementById("label-input");

    itemPreviewLabel.textContent = labelInput.value;
    itemPreview.classList.toggle("no-label", labelInput.value === "");
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
                setItemSize();
                const nextIndex = (index + 1) % inputs.length;
                inputs[nextIndex].focus();
            }
        });
        input.addEventListener('focus', () => input.select());
    });
}

// One listener on the container handles every tier label, including ones added later,
// and always follows the order the tiers are currently shown in.
function setupTierNavigation() {
    const container = document.getElementById("tiers-container");
    const isLabel = el => el.classList?.contains('tier-label');

    container.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || !isLabel(e.target)) return;
        e.preventDefault();

        const labels = [...container.querySelectorAll('.tier-label')];
        const index = labels.indexOf(e.target);
        const movement = e.shiftKey ? -1 : 1;
        const nextIndex = (index + movement + labels.length) % labels.length;
        labels[nextIndex].focus();
    });

    container.addEventListener('focusin', (e) => {
        if (isLabel(e.target)) e.target.select();
    });
}

function setupFontSizeSelector() {
    const fontSizeElement = document.getElementById('font-size-option');

    fontSizeElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            fontSizeElement.select();
        }
    });
    fontSizeElement.addEventListener('focus', () => fontSizeElement.select());
}

function setupEnterItemAddition() {
    const labelInput = document.getElementById("label-input");

    labelInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitItemPreview();
        }
    });
}

function setupDraggableTiers() {
    Sortable.create(document.getElementById("tiers-container"), {
        animation: 150,
        handle: ".handle",
        group: "tier",
        ...DRAG_OPTIONS
    });
}

function setupScrollDrag() {
    // Pixels per frame: negative = up, positive = down, 0 = no scroll
    let scrollVelocity = 0;
    // Scrolling starts within this distance of the top/bottom edge (at least 80px, up to 16% of the window)
    const scrollZone = () => Math.max(80, window.innerHeight * 0.16);
    const minSpeed = 4;
    const maxSpeed = 16;

    function onDragOver(e) {
        const zone = scrollZone();
        const fromTop = e.clientY;
        const fromBottom = window.innerHeight - e.clientY;
        // Speed ramps up the closer the cursor gets to the edge
        const speedFor = dist => minSpeed + (maxSpeed - minSpeed) * (1 - Math.max(0, dist) / zone);

        if (fromTop < zone) {
            scrollVelocity = -speedFor(fromTop);
        } else if (fromBottom < zone) {
            scrollVelocity = speedFor(fromBottom);
        } else {
            scrollVelocity = 0;
        }
    }

    let dragging = false;

    function smoothScroll() {
        if (dragging && scrollVelocity !== 0) {
            window.scrollBy(0, scrollVelocity);
        }
        requestAnimationFrame(smoothScroll);
    }

    const stop = () => { dragging = false; scrollVelocity = 0; };

    // Capture phase on window: these run before Sortable can stop the events from bubbling
    const capture = { capture: true };

    // Sortable drags (fallback mode) are plain mouse moves: only act while Sortable is dragging
    window.addEventListener("mousemove", (e) => {
        if (!Sortable.dragged) return;
        dragging = true;
        onDragOver(e);
    }, capture);

    // Image files dragged in from outside the page still use native drag events
    window.addEventListener("dragover", (e) => { dragging = true; onDragOver(e); }, capture);
    window.addEventListener("drop", stop, capture);
    window.addEventListener("dragend", stop, capture);
    window.addEventListener("dragleave", (e) => { if (!e.relatedTarget) stop(); }, capture);

    window.addEventListener("mouseup", stop, capture);
    window.addEventListener("pointerup", stop, capture);
    window.addEventListener("blur", stop);
    requestAnimationFrame(smoothScroll);
}

function setupDeletionZone() {
    const deletionZone = document.getElementById("deletion-zone");

    Sortable.create(deletionZone, {
        animation: 0,
        ...DRAG_OPTIONS,
        group: {
            put: ["item-collection", "tier"]
        },
        onAdd: function (evt) {
            const dropped = evt.item;

            // Dropping a whole tier that still has items: check first, and put it back if cancelled
            const itemCount = dropped.classList.contains("tier") ? dropped.querySelectorAll(".item").length : 0;
            if (itemCount && !confirm(`Delete this tier and its ${itemCount} item${itemCount === 1 ? "" : "s"}?`)) {
                evt.from.insertBefore(dropped, evt.from.children[evt.oldIndex] ?? null);
                return;
            }

            if (editingItem && dropped.contains(editingItem)) stopEditingItem();
            dropped.remove();
        }
    });
}

// Hooks up the page's buttons and inputs (kept out of the HTML)
function setupControls() {
    const on = (id, event, handler) => document.getElementById(id).addEventListener(event, handler);

    // Arrow functions where the handler takes optional arguments, so the event isn't passed in
    on('remove-tier-button', 'click', () => removeLastTier());
    on('add-tier-button', 'click', () => createNewTier());
    on('clear-queue-button', 'click', () => confirmClearQueue());
    on('label-img-height-percentage', 'input', () => changeItemImageLabelRange());
    on('autosize-label', 'change', () => changeItemImageLabelRange());
    on('font-size-option', 'change', () => changeItemPreviewFontSize());
    on('apply-font-size-all-button', 'click', () => applyFontSizeToAllItems());
    on('item-width', 'change', () => setItemSize());
    on('item-height', 'change', () => setItemSize());
    on('add-item-button', 'click', () => submitItemPreview());
    on('cancel-edit-button', 'click', () => stopEditingItem());
    on('image-upload', 'change', () => changeItemPreviewImage());
    on('remove-image-button', 'click', () => setPreviewImage(null));
    on('label-input', 'input', () => changeItemPreviewLabel());
    on('bulk-file-upload', 'change', () => bulkItemCreator());
    on('save-template-button', 'click', () => exportTemplateJsonFile());
    on('save-personal-button', 'click', () => exportPersonalJsonFile());
    on('json-upload', 'change', () => importJsonFile());
    on('export-png-button', 'click', () => exportPng());
    on('new-tierlist-button', 'click', () => startNewTierList());
}

function getTierListState() {
    const titleElement = document.getElementById('tierlist-title');

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
        baseItemSize: {
            width: document.getElementById('item-width').value + "px",
            height: document.getElementById('item-height').value + "px"
        },
        idCounter: itemIdCounter,
        images,
        allTiers,
        queue
    };
}

function downloadJson(data, filename) {
    const json = JSON.stringify(data, null, 4);
    downloadBlob(new Blob([json], { type: 'application/json' }), filename);
}

function downloadBlob(blob, filename) {
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

// Measures the live page: how wide the tiers need to be to fit their widest row of items,
// and how wide each tier label currently is
function measureTiersForExport() {
    const tiers = [...document.querySelectorAll("#tiers-container > .tier")];
    let tierWidth = 0;
    const labelWidths = tiers.map(tier => {
        const tierRect = tier.getBoundingClientRect();
        const tierStyle = getComputedStyle(tier);
        const container = tier.querySelector(".item-container");
        const containerStyle = getComputedStyle(container);

        // An empty tier still keeps room for one item
        const itemW = parseFloat(containerStyle.getPropertyValue("--item-w")) || 80;
        let right = container.getBoundingClientRect().left + parseFloat(containerStyle.paddingLeft) + itemW + 2;
        for (const item of container.querySelectorAll(".item")) {
            right = Math.max(right, item.getBoundingClientRect().right + 1);   // + item margin
        }

        const width = right - tierRect.left
            + parseFloat(containerStyle.paddingRight)
            + parseFloat(tierStyle.paddingRight)
            + 2;   // a little breathing room on the right
        tierWidth = Math.max(tierWidth, width);

        return tier.querySelector(".tier-label").getBoundingClientRect().width;
    });
    return { tierWidth: Math.ceil(tierWidth) + 1, labelWidths };
}

// In html2canvas's copy of the page: shrink the tiers to fit their items and
// shrink the board to fit the tiers and title, so the image has no empty space on the right
function trimTiersForExport(doc, { tierWidth, labelWidths }) {
    const board = doc.getElementById("all-item-holders-container");
    const tiersContainer = doc.getElementById("tiers-container");
    const title = doc.getElementById("tierlist-title");

    board.style.width = "fit-content";
    tiersContainer.style.width = "fit-content";
    tiersContainer.style.margin = "0 auto";
    if (title) {
        title.style.minWidth = "0";
        title.style.maxWidth = "none";
    }

    doc.querySelectorAll("#tiers-container > .tier").forEach((tier, i) => {
        tier.style.boxSizing = "border-box";
        tier.style.width = tierWidth + "px";
        // Label widths are a percentage of the tier, so lock in their on-screen size
        const label = tier.querySelector(".tier-label");
        if (label && labelWidths[i] !== undefined) label.style.width = labelWidths[i] + "px";
    });
}

// Saves the title and tiers (not the queue or buttons) as a PNG, using html2canvas
async function exportPng() {
    if (typeof html2canvas !== "function") {
        alert("Image export isn't available right now (html2canvas didn't load).");
        return;
    }

    const button = document.getElementById("export-png-button");
    const source = document.getElementById("all-item-holders-container");
    const originalTextareas = [...source.querySelectorAll("textarea")];
    const title = document.getElementById("tierlist-title").value.trim();

    const fit = measureTiersForExport();

    button.disabled = true;
    try {
        const canvas = await html2canvas(source, {
            backgroundColor: getComputedStyle(document.body).backgroundColor,
            ignoreElements: el => el.matches?.(".side-button-container, #queue"),
            // html2canvas draws textareas poorly, so swap them for plain text in its copy of the page
            onclone: (doc) => {
                doc.querySelectorAll("#all-item-holders-container textarea").forEach((textarea, i) => {
                    const text = originalTextareas[i]?.value ?? textarea.value;
                    if (textarea.id === "tierlist-title" && !text.trim()) {
                        textarea.remove();
                        return;
                    }
                    const div = doc.createElement("div");
                    div.id = textarea.id;
                    div.className = textarea.className;
                    div.textContent = text;
                    textarea.replaceWith(div);
                });
                trimTiersForExport(doc, fit);
            }
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("Canvas produced no image");
        downloadBlob(blob, (title || "My") + " Tierlist.png");
    } catch (err) {
        console.error(err);
        alert("Sorry, the image couldn't be created.");
    } finally {
        button.disabled = false;
    }
}

function isValidTierListState(data) {
    return data !== null && typeof data === 'object'
        && Array.isArray(data.queue)
        && Array.isArray(data.allTiers)
        && data.allTiers.every(tier => tier && Array.isArray(tier.tierItems));
}

// Throws (without touching the page) if `data` isn't a tier list
function loadTierListState(data) {
    if (!isValidTierListState(data)) {
        throw new Error("Not a tier list file");
    }

    stopEditingItem();
    clearAllTiers();
    clearQueue();

    document.getElementById('tierlist-title').value = data.tierListTitle ?? "";

    const width = parseInt(data.baseItemSize?.width);
    const height = parseInt(data.baseItemSize?.height);
    if (!Number.isNaN(width)) document.getElementById("item-width").value = width;
    if (!Number.isNaN(height)) document.getElementById("item-height").value = height;
    setItemSize();
    itemIdCounter = Number(data.idCounter) || 0;

    const makeItem = item => createImageItemElement(
        item.itemID,
        item.itemImg ?? data.images?.[item.itemImgRef] ?? null,
        item.itemText, item.itemTextAreaHeight, item.itemFontSize
    );
    data.allTiers.forEach(tier => {
        const newTier = createNewTier(tier.tierLabel, toHexColor(tier.tierColor));
        tier.tierItems.forEach(item => addItemToTier(makeItem(item), newTier));
    });

    data.queue.forEach(item => addItemToQueue(makeItem(item)));
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

function createDefaultTiers() {
    const initialTierLabels = ['S', 'A', 'B', 'C', 'D', 'F'];
    const initialTierColors = ['#8a2e3f', '#d37755', '#dc995d', '#dec575', '#a8b164', '#6f975e'];
    initialTierLabels.forEach((tierLabel, i) => {
        createNewTier(tierLabel, initialTierColors[i]);
    });
}

async function onStartup() {
    setupControls();
    setItemSize();

    // Restore the last session if there is one, otherwise make the default tiers
    const saved = await loadState().catch(err => {
        console.error("Couldn't load saved tier list:", err);
        return null;
    });

    let restored = false;
    if (saved) {
        try {
            loadTierListState(saved);
            restored = true;
        } catch (err) {
            console.error("Saved tier list was invalid:", err);
        }
    }
    if (!restored) createDefaultTiers();

    changeItemPreviewFontSize();
    changeItemImageLabelRange();
    setupTitleEnterCommand();
    setupTierNavigation();
    setupDraggableTiers();
    setupDraggableQueue();
    setupEnterNavigation();
    setupEnterItemAddition();
    setupDeletionZone();
    setupScrollDrag();
    setupFontSizeSelector();
    setupFileDropAndPaste();
    setupItemEditing();
    setupDoubleRightClickDelete();

    // Start watching for changes only after everything is built
    startAutosave();
    navigator.storage?.persist?.();
}

document.addEventListener("DOMContentLoaded", () => {
    onStartup();
});
