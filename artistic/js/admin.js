const STORAGE_KEY = "artistic.admin.prompts.v2";
const CATEGORY_STORAGE_KEY = "artistic.admin.categories.v1";

const promptList = document.getElementById("promptList");
const categoryList = document.getElementById("categoryList");
const promptCount = document.getElementById("promptCount");
const storageStatus = document.getElementById("storageStatus");

const addPromptButton = document.getElementById("addPromptButton");
const addCategoryButton = document.getElementById("addCategoryButton");
const newCategoryFromFormButton =
    document.getElementById("newCategoryFromFormButton");
const exportButton = document.getElementById("exportButton");
const resetButton = document.getElementById("resetButton");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalEyebrow = document.getElementById("modalEyebrow");
const closeModalButton = document.getElementById("closeModalButton");
const cancelButton = document.getElementById("cancelButton");

const categoryModal = document.getElementById("categoryModal");
const categoryModalTitle =
    document.getElementById("categoryModalTitle");
const categoryModalEyebrow =
    document.getElementById("categoryModalEyebrow");
const closeCategoryModalButton =
    document.getElementById("closeCategoryModalButton");
const cancelCategoryButton =
    document.getElementById("cancelCategoryButton");
const categoryForm =
    document.getElementById("categoryForm");
const categoryNameInput =
    document.getElementById("categoryNameInput");

const categoryActionModal =
    document.getElementById("categoryActionModal");
const categoryActionModalTitle =
    document.getElementById("categoryActionModalTitle");
const categoryActionModalEyebrow =
    document.getElementById("categoryActionModalEyebrow");
const categoryActionMessage =
    document.getElementById("categoryActionMessage");
const categoryTargetSelect =
    document.getElementById("categoryTargetSelect");
const categoryTargetHelp =
    document.getElementById("categoryTargetHelp");
const categoryActionWarning =
    document.getElementById("categoryActionWarning");
const closeCategoryActionModalButton =
    document.getElementById("closeCategoryActionModalButton");
const cancelCategoryActionButton =
    document.getElementById("cancelCategoryActionButton");
const confirmCategoryActionButton =
    document.getElementById("confirmCategoryActionButton");

const movePromptsModal = document.getElementById("movePromptsModal");
const closeMovePromptsButton = document.getElementById("closeMovePromptsButton");
const cancelMovePromptsButton = document.getElementById("cancelMovePromptsButton");
const confirmMovePromptsButton = document.getElementById("confirmMovePromptsButton");
const selectAllMoveButton = document.getElementById("selectAllMoveButton");
const clearMoveSelectionButton = document.getElementById("clearMoveSelectionButton");
const moveSelectionCount = document.getElementById("moveSelectionCount");
const moveSourceLabel = document.getElementById("moveSourceLabel");
const movePromptGrid = document.getElementById("movePromptGrid");
const moveTargetCategorySelect = document.getElementById("moveTargetCategorySelect");

const qrModal = document.getElementById("qrModal");
const closeQrModalButton = document.getElementById("closeQrModalButton");
const qrCode = document.getElementById("qrCode");
const qrPromptTitle = document.getElementById("qrPromptTitle");
const qrUrlInput = document.getElementById("qrUrlInput");
const copyQrUrlButton = document.getElementById("copyQrUrlButton");
const downloadQrButton = document.getElementById("downloadQrButton");

const promptForm = document.getElementById("promptForm");

const titleInput = document.getElementById("titleInput");
const idInput = document.getElementById("idInput");
const typeInput = document.getElementById("typeInput");
const detectTypeButton = document.getElementById("detectTypeButton");
const tagsInput = document.getElementById("tagsInput");
const titleUkInput = document.getElementById("titleUkInput");
const descriptionUkInput = document.getElementById("descriptionUkInput");
const promptUkInput = document.getElementById("promptUkInput");
const categorySelect = document.getElementById("categorySelect");

const imageDropzone = document.getElementById("imageDropzone");
const imageFileInput = document.getElementById("imageFileInput");
const imagePathInput = null;
const imageEmptyState = document.getElementById("imageEmptyState");
const imageGalleryEditor = document.getElementById("imageGalleryEditor");

const descriptionInput =
    document.getElementById("descriptionInput");
const promptInput =
    document.getElementById("promptInput");
const publishedInput =
    document.getElementById("publishedInput");
const orderInput =
    document.getElementById("orderInput");

let prompts = [];
let categories = [];
let editingId = null;
let editingCategoryName = null;
let categoryAfterCreate = false;
let selectedImages = [];
let categoryActionMode = null;
let categoryActionSource = null;
let moveSourceCategory = null;
let selectedMovePromptIds = new Set();
let activeQrPrompt = null;

const IMAGE_DB_NAME = "artistic.admin.images.v1";
const IMAGE_STORE_NAME = "images";
const imageCache = new Map();
let imageDbPromise = null;

function openImageDb() {
    if (imageDbPromise) return imageDbPromise;
    imageDbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not available in this browser."));
            return;
        }
        const request = indexedDB.open(IMAGE_DB_NAME, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                request.result.createObjectStore(IMAGE_STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Could not open image storage."));
    });
    return imageDbPromise;
}

async function putStoredImage(id, src, name) {
    const db = await openImageDb();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(IMAGE_STORE_NAME, "readwrite");
        tx.objectStore(IMAGE_STORE_NAME).put({ id, src, name: name || id });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Could not save image."));
    });
    imageCache.set(id, src);
    return id;
}

async function getStoredImage(id) {
    if (!id) return "";
    if (imageCache.has(id)) return imageCache.get(id);
    try {
        const db = await openImageDb();
        const record = await new Promise((resolve, reject) => {
            const tx = db.transaction(IMAGE_STORE_NAME, "readonly");
            const request = tx.objectStore(IMAGE_STORE_NAME).get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        const src = record?.src || "";
        if (src) imageCache.set(id, src);
        return src;
    } catch (error) {
        console.error("Could not load stored image:", error);
        return "";
    }
}

function getImageSrc(item) {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.src || imageCache.get(item.id) || "";
}

async function hydratePromptImages(list) {
    const tasks = [];
    list.forEach((prompt) => {
        if (!Array.isArray(prompt.images)) return;
        prompt.images.forEach((item) => {
            if (item && typeof item === "object" && item.id && !item.src) {
                tasks.push(getStoredImage(item.id).then((src) => { item.src = src; }));
            }
        });
    });
    await Promise.all(tasks);
}

async function migrateDataUrlImages(list) {
    let changed = false;
    for (const prompt of list) {
        if (!Array.isArray(prompt.images)) continue;
        for (const item of prompt.images) {
            if (!item || typeof item !== "object") continue;
            if (!item.id && String(item.src || "").startsWith("data:")) {
                const id = `img_${crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(36).slice(2)}`;
                await putStoredImage(id, item.src, item.name);
                item.id = id;
                changed = true;
            }
        }
    }
    return changed;
}

async function persistPromptImages(prompt) {
    const output = [];
    for (let index = 0; index < selectedImages.length; index += 1) {
        const item = selectedImages[index];
        const name = item.name || `Master image ${index + 1}`;
        if (item.id && !String(item.src || "").startsWith("data:")) {
            output.push({ id: item.id, name, src: item.src || imageCache.get(item.id) || "" });
            continue;
        }
        if (String(item.src || "").startsWith("data:")) {
            const id = item.id || `img_${crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(36).slice(2)}`;
            await putStoredImage(id, item.src, name);
            output.push({ id, name, src: item.src });
        } else if (item.src) {
            output.push({ src: item.src, name });
        }
    }
    prompt.images = output;
    return output;
}

function storageSafePrompts(list) {
    return list.map((prompt) => ({
        ...prompt,
        images: normalizeImages(prompt).map((item) => {
            const copy = { ...item };
            if (copy.id && String(copy.src || "").startsWith("data:")) delete copy.src;
            return copy;
        })
    }));
}


/*
 * CATEGORIES
 */

function normalizeCategoryName(name) {
    return String(name || "")
        .trim()
        .replace(/\s+/g, " ");
}


function uniqueCategoryNames(list) {
    const result = [];

    list.forEach((name) => {
        const normalized =
            normalizeCategoryName(name);

        if (
            normalized &&
            !result.some(
                (item) =>
                    item.toLowerCase() ===
                    normalized.toLowerCase()
            )
        ) {
            result.push(normalized);
        }
    });

    return result.sort((a, b) =>
        a.localeCompare(b)
    );
}


function getCategoriesFromPrompts() {
    return uniqueCategoryNames(
        prompts.map(
            (prompt) => prompt.category
        )
    );
}


function loadCategories() {
    const saved =
        localStorage.getItem(
            CATEGORY_STORAGE_KEY
        );

    if (saved) {
        try {
            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed)) {
                categories =
                    uniqueCategoryNames(parsed);

                return;
            }
        } catch (error) {
            console.error(
                "Failed to parse local category data:",
                error
            );
        }
    }

    /*
     * First run / migration:
     * build the independent category list
     * from existing prompt data once.
     */
    categories =
        getCategoriesFromPrompts();

    saveCategories();
}


function saveCategories() {
    localStorage.setItem(
        CATEGORY_STORAGE_KEY,
        JSON.stringify(categories)
    );
}


function getCategoryUsageCount(category) {
    return prompts.filter(
        (prompt) =>
            normalizeCategoryName(
                prompt.category
            ).toLowerCase() ===
            category.toLowerCase()
    ).length;
}


function getOtherCategories(sourceCategory) {
    return categories.filter(
        (category) =>
            category.toLowerCase() !==
            sourceCategory.toLowerCase()
    );
}


function renderCategories() {
    categoryList.replaceChildren();

    if (categories.length === 0) {
        const empty =
            document.createElement("div");

        empty.className =
            "admin-state";

        empty.textContent =
            "No categories yet. Add your first category.";

        categoryList.appendChild(empty);

        return;
    }

    categories.forEach((category) => {
        const row =
            document.createElement("article");

        row.className =
            "category-list__row";

        const name =
            document.createElement("div");

        name.className =
            "category-list__name";

        name.textContent =
            category;

        const usage =
            document.createElement("div");

        usage.className =
            "category-list__usage";

        const count =
            prompts.filter(
                (prompt) =>
                    normalizeCategoryName(
                        prompt.category
                    ).toLowerCase() ===
                    category.toLowerCase()
            ).length;

        usage.textContent =
            `${count} ${count === 1 ? "prompt" : "prompts"}`;

        const actions =
            document.createElement("div");

        actions.className =
            "category-list__actions";

        const renameButton =
            createRowButton("RENAME");

        renameButton.addEventListener(
            "click",
            () => openEditCategoryModal(category)
        );

        const usageCount =
            getCategoryUsageCount(category);

        if (usageCount > 0) {
            const moveButton =
                createRowButton("MOVE");

            moveButton.addEventListener(
                "click",
                () => openMovePromptsModal(category)
            );

            actions.append(moveButton);
        }

        const deleteButton =
            createRowButton(
                "DELETE",
                "button--delete"
            );

        deleteButton.addEventListener(
            "click",
            () => deleteCategory(category)
        );

        actions.append(
            renameButton,
            deleteButton
        );

        row.append(
            name,
            usage,
            actions
        );

        categoryList.appendChild(row);
    });
}


function populateCategorySelect(
    selectedCategory = ""
) {
    categorySelect.replaceChildren();

    categories.forEach((category) => {
        const option =
            document.createElement("option");

        option.value =
            category;

        option.textContent =
            category;

        categorySelect.appendChild(option);
    });

    if (selectedCategory) {
        const matching =
            categories.find(
                (category) =>
                    category.toLowerCase() ===
                    selectedCategory.toLowerCase()
            );

        if (matching) {
            categorySelect.value =
                matching;
        }
    }

    if (
        !categorySelect.value &&
        categories.length > 0
    ) {
        categorySelect.value =
            categories[0];
    }
}


function openAddCategoryModal(
    fromPromptForm = false
) {
    editingCategoryName = null;
    categoryAfterCreate =
        fromPromptForm;

    categoryModalEyebrow.textContent =
        "ADD CATEGORY";

    categoryModalTitle.textContent =
        "New Category";

    categoryForm.reset();

    openCategoryModal();
}


function openEditCategoryModal(
    category
) {
    editingCategoryName =
        category;

    categoryAfterCreate =
        false;

    categoryModalEyebrow.textContent =
        "RENAME CATEGORY";

    categoryModalTitle.textContent =
        "Rename Category";

    categoryNameInput.value =
        category;

    openCategoryModal();
}


function openCategoryModal() {
    categoryModal.classList.add("is-open");

    categoryModal.setAttribute(
        "aria-hidden",
        "false"
    );

    categoryNameInput.focus();
}


function closeCategoryModal() {
    categoryModal.classList.remove("is-open");

    categoryModal.setAttribute(
        "aria-hidden",
        "true"
    );

    editingCategoryName = null;
    categoryAfterCreate = false;
}


function saveCategory(event) {
    event.preventDefault();

    if (!categoryForm.reportValidity()) {
        return;
    }

    const newName =
        normalizeCategoryName(
            categoryNameInput.value
        );

    if (!newName) {
        return;
    }

    const duplicate =
        categories.some(
            (category) =>
                category.toLowerCase() ===
                    newName.toLowerCase() &&
                category.toLowerCase() !==
                    editingCategoryName.toLowerCase()
        );

    if (duplicate) {
        alert(
            "A category with this name already exists."
        );

        categoryNameInput.focus();

        return;
    }

    if (editingCategoryName) {
        const usageCount =
            prompts.filter(
                (prompt) =>
                    normalizeCategoryName(
                        prompt.category
                    ).toLowerCase() ===
                    editingCategoryName.toLowerCase()
            ).length;

        if (usageCount > 0) {
            const confirmed =
                window.confirm(
                    `Rename "${editingCategoryName}" to "${newName}"?\n\nThis will update ${usageCount} ${
                        usageCount === 1
                            ? "prompt"
                            : "prompts"
                    }.`
                );

            if (!confirmed) {
                return;
            }
        }

        const index =
            categories.findIndex(
                (category) =>
                    category ===
                    editingCategoryName
            );

        if (index === -1) {
            return;
        }

        categories[index] =
            newName;

        prompts.forEach((prompt) => {
            if (
                normalizeCategoryName(
                    prompt.category
                ).toLowerCase() ===
                editingCategoryName.toLowerCase()
            ) {
                prompt.category =
                    newName;
            }
        });

        categories =
            uniqueCategoryNames(categories);

        saveCategories();
        saveLocalData();

        renderCategories();
        renderPrompts();

        if (editingId) {
            populateCategorySelect(
                newName
            );
        }
    } else {
        categories.push(newName);

        categories =
            uniqueCategoryNames(categories);

        saveCategories();

        renderCategories();

        populateCategorySelect(
            newName
        );
    }

    const shouldSelectNewCategory =
        categoryAfterCreate &&
        !editingCategoryName;

    closeCategoryModal();

    if (shouldSelectNewCategory) {
        populateCategorySelect(
            newName
        );
    }
}


function getPromptImages(prompt) {
    return normalizeImages(prompt);
}


function renderMovePromptGrid() {
    movePromptGrid.replaceChildren();

    const promptsInSource = prompts
        .filter((prompt) =>
            normalizeCategoryName(prompt.category).toLowerCase() ===
            moveSourceCategory.toLowerCase()
        )
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    promptsInSource.forEach((prompt) => {
        const card = document.createElement("label");
        card.className = "prompt-move__card";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedMovePromptIds.has(prompt.id);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) selectedMovePromptIds.add(prompt.id);
            else selectedMovePromptIds.delete(prompt.id);
            card.classList.toggle("is-selected", checkbox.checked);
            updateMoveSelectionUI();
        });

        const images = getPromptImages(prompt);
        if (getImageSrc(images[0])) {
            const img = document.createElement("img");
            img.src = getImageSrc(images[0]);
            img.alt = prompt.title || "Prompt preview";
            card.appendChild(img);
        } else {
            const empty = document.createElement("div");
            empty.className = "prompt-move__no-image";
            empty.textContent = "NO PREVIEW";
            card.appendChild(empty);
        }

        const body = document.createElement("div");
        body.className = "prompt-move__card-body";
        const title = document.createElement("div");
        title.className = "prompt-move__card-title";
        title.textContent = prompt.title || "Untitled";
        const id = document.createElement("div");
        id.className = "prompt-move__card-id";
        id.textContent = prompt.id || "—";
        body.append(title, id);
        card.append(checkbox, body);

        if (checkbox.checked) card.classList.add("is-selected");
        movePromptGrid.appendChild(card);
    });

    updateMoveSelectionUI();
}


function updateMoveSelectionUI() {
    const count = selectedMovePromptIds.size;
    moveSelectionCount.textContent =
        `${count} ${count === 1 ? "prompt" : "prompts"} selected`;
    confirmMovePromptsButton.disabled = count === 0 || !moveTargetCategorySelect.value;
}


function openMovePromptsModal(category) {
    moveSourceCategory = category;
    selectedMovePromptIds = new Set();

    moveSourceLabel.textContent = `from “${category}”`;
    moveTargetCategorySelect.replaceChildren();

    getOtherCategories(category).forEach((target) => {
        const option = document.createElement("option");
        option.value = target;
        option.textContent = target;
        moveTargetCategorySelect.appendChild(option);
    });

    renderMovePromptGrid();
    updateMoveSelectionUI();

    movePromptsModal.classList.add("is-open");
    movePromptsModal.setAttribute("aria-hidden", "false");
}


function closeMovePromptsModal() {
    movePromptsModal.classList.remove("is-open");
    movePromptsModal.setAttribute("aria-hidden", "true");
    moveSourceCategory = null;
    selectedMovePromptIds = new Set();
}


function confirmSelectiveMove() {
    if (!moveSourceCategory || selectedMovePromptIds.size === 0) return;

    const target = moveTargetCategorySelect.value;
    if (!target) return;

    const count = selectedMovePromptIds.size;
    const confirmed = window.confirm(
        `Move ${count} ${count === 1 ? "prompt" : "prompts"} from “${moveSourceCategory}” to “${target}”?`
    );

    if (!confirmed) return;

    prompts.forEach((prompt) => {
        if (selectedMovePromptIds.has(prompt.id)) {
            prompt.category = target;
        }
    });

    saveLocalData();
    renderPrompts();
    closeMovePromptsModal();
}


function openCategoryActionModal(
    mode,
    sourceCategory
) {
    categoryActionMode = mode;
    categoryActionSource = sourceCategory;

    const usageCount =
        getCategoryUsageCount(sourceCategory);

    const targets =
        getOtherCategories(sourceCategory);

    categoryTargetSelect.replaceChildren();

    targets.forEach((category) => {
        const option =
            document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryTargetSelect.appendChild(option);
    });

    if (mode === "move") {
        categoryActionModalEyebrow.textContent =
            "MOVE CATEGORY";

        categoryActionModalTitle.textContent =
            "Move Prompts";

        categoryActionMessage.textContent =
            `"${sourceCategory}" is used by ${usageCount} ${
                usageCount === 1 ? "prompt" : "prompts"
            }.`;

        categoryTargetHelp.textContent =
            "All prompts in this category will be reassigned to the selected category.";

        categoryActionWarning.textContent =
            "The source category will remain available.";

        confirmCategoryActionButton.textContent =
            "MOVE PROMPTS";
    } else {
        categoryActionModalEyebrow.textContent =
            "DELETE CATEGORY";

        categoryActionModalTitle.textContent =
            "Move & Delete";

        categoryActionMessage.textContent =
            `"${sourceCategory}" is used by ${usageCount} ${
                usageCount === 1 ? "prompt" : "prompts"
            }.`;

        categoryTargetHelp.textContent =
            "The prompts will be reassigned before the source category is deleted.";

        categoryActionWarning.textContent =
            "This action cannot be undone.";

        confirmCategoryActionButton.textContent =
            "MOVE & DELETE";
    }

    if (targets.length === 0) {
        categoryTargetSelect.disabled = true;
        confirmCategoryActionButton.disabled = true;

        categoryActionWarning.textContent =
            "There is no other category available. Create another category first.";
    } else {
        categoryTargetSelect.disabled = false;
        confirmCategoryActionButton.disabled = false;
        categoryTargetSelect.value = targets[0];
    }

    categoryActionModal.classList.add("is-open");

    categoryActionModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function openMoveCategoryModal(category) {
    openCategoryActionModal(
        "move",
        category
    );
}


function openDeleteCategoryModal(category) {
    openCategoryActionModal(
        "button--delete",
        category
    );
}


function closeCategoryActionModal() {
    categoryActionModal.classList.remove("is-open");

    categoryActionModal.setAttribute(
        "aria-hidden",
        "true"
    );

    categoryActionMode = null;
    categoryActionSource = null;
}


function confirmCategoryAction() {
    if (
        !categoryActionMode ||
        !categoryActionSource
    ) {
        return;
    }

    const sourceCategory =
        categoryActionSource;

    const targetCategory =
        normalizeCategoryName(
            categoryTargetSelect.value
        );

    const usageCount =
        getCategoryUsageCount(
            sourceCategory
        );

    if (!targetCategory) {
        return;
    }

    if (usageCount === 0) {
        closeCategoryActionModal();

        if (categoryActionMode === "button--delete") {
            deleteEmptyCategory(
                sourceCategory
            );
        }

        return;
    }

    if (
        categoryActionMode === "button--delete"
    ) {
        const confirmed =
            window.confirm(
                `Move ${usageCount} ${
                    usageCount === 1 ? "prompt" : "prompts"
                } from "${sourceCategory}" to "${targetCategory}" and delete "${sourceCategory}"?\n\nThis action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }
    }

    prompts.forEach((prompt) => {
        if (
            normalizeCategoryName(
                prompt.category
            ).toLowerCase() ===
            sourceCategory.toLowerCase()
        ) {
            prompt.category =
                targetCategory;
        }
    });

    if (
        categoryActionMode === "button--delete"
    ) {
        categories =
            categories.filter(
                (category) =>
                    category.toLowerCase() !==
                    sourceCategory.toLowerCase()
            );

        saveCategories();
    }

    saveLocalData();

    renderPrompts();
    renderCategories();

    populateCategorySelect(
        targetCategory
    );

    closeCategoryActionModal();
}


function deleteEmptyCategory(category) {
    const confirmed =
        window.confirm(
            `Delete category "${category}"?\n\nThis action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    categories =
        categories.filter(
            (item) =>
                item.toLowerCase() !==
                category.toLowerCase()
        );

    saveCategories();

    renderCategories();
    populateCategorySelect();
}


function deleteCategory(category) {
    const usageCount =
        getCategoryUsageCount(category);

    if (usageCount > 0) {
        openDeleteCategoryModal(category);
        return;
    }

    deleteEmptyCategory(category);
}




function getSelectedCategory() {
    return normalizeCategoryName(
        categorySelect.value
    );
}


/*
 * PROMPTS
 */

function stripGuide(prompt) {
    const legacyTitle = typeof prompt.title === "string" ? prompt.title : (prompt.title?.en || prompt.title?.uk || "");
    const legacyDescription = typeof prompt.description === "string" ? prompt.description : (prompt.description?.en || prompt.description?.uk || "");
    const legacyPrompt = typeof prompt.prompt === "string" ? prompt.prompt : (prompt.prompt?.en || prompt.prompt?.uk || "");
    const translations = prompt.translations && typeof prompt.translations === "object" ? prompt.translations : {};
    const uk = translations.uk && typeof translations.uk === "object" ? translations.uk : {};
    return {
        id: prompt.id || "",
        title: legacyTitle,
        type: ["vertical","horizontal","square"].includes(String(prompt.type || "").toLowerCase()) ? String(prompt.type).toLowerCase() : "vertical",
        category: prompt.category || "",
        tags: Array.isArray(prompt.tags) ? prompt.tags.filter(Boolean).map(String) : [],
        description: legacyDescription,
        images: normalizeImages(prompt).map(item => ({ id: item.id || "", src: item.src || "", name: item.name || "" })).filter(item => item.id || item.src),
        prompt: legacyPrompt,
        translations: {
            uk: {
                title: uk.title || prompt.titleUk || "",
                description: uk.description || prompt.descriptionUk || "",
                prompt: uk.prompt || prompt.promptUk || ""
            }
        },
        createdAt: prompt.createdAt || "",
        published: prompt.published !== false,
        order: Math.max(1, Number(prompt.order) || 1),
        copyCount: Math.max(0, Number(prompt.copyCount) || 0)
    };
}

function normalizePrompts(list) {
    return list.map(stripGuide);
}


function migratePromptImages(prompt) {
    const images = normalizeImages(prompt);
    const migrated = { ...prompt, images };
    delete migrated.image;
    return migrated;
}


async function loadInitialPrompts() {
    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (saved) {
        try {
            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed)) {
                prompts =
                    normalizePrompts(parsed);
                await hydratePromptImages(prompts);
                if (await migrateDataUrlImages(prompts)) saveLocalData();
                return;
            }
        } catch (error) {
            console.error(
                "Failed to parse local admin data:",
                error
            );
        }
    }

    try {
        const response =
            await fetch("data/prompts.json");

        if (!response.ok) {
            throw new Error(
                `HTTP error: ${response.status}`
            );
        }

        const data =
            await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Prompt data is not an array."
            );
        }

        prompts =
            normalizePrompts(data);
        await hydratePromptImages(prompts);
        saveLocalData();
    } catch (error) {
        console.error(
            "Failed to load initial prompts:",
            error
        );

        prompts = [];
    }
}


function saveLocalData() {
    prompts = normalizePrompts(prompts);
    const safe = storageSafePrompts(prompts);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
        updateStorageStatus();
        return true;
    } catch (error) {
        console.error("Could not save local prompt data:", error);
        alert("The prompt data could not be saved locally. Images are stored separately, but your browser storage may be full. Try Reset Local Data after exporting your JSON.");
        return false;
    }
}


function updateStorageStatus() {
    storageStatus.textContent =
        `LOCAL • ${prompts.length} PROMPTS`;
}


function sortPrompts() {
    prompts.sort((a, b) => {
        const orderDifference =
            (Number(a.order) || 0) -
            (Number(b.order) || 0);

        if (orderDifference !== 0) {
            return orderDifference;
        }

        return String(
            a.title || ""
        ).localeCompare(
            String(b.title || "")
        );
    });
}


function renderPrompts() {
    sortPrompts();

    promptCount.textContent =
        prompts.length;

    promptList.replaceChildren();

    if (prompts.length === 0) {
        const empty =
            document.createElement("div");

        empty.className =
            "admin-state";

        empty.textContent =
            "No prompts yet. Add your first prompt.";

        promptList.appendChild(empty);

        renderCategories();
        updateStorageStatus();

        return;
    }

    prompts.forEach((prompt) => {
        const row =
            document.createElement("article");

        row.className =
            "admin-prompt-row";

        const main =
            document.createElement("div");

        main.className =
            "admin-prompt-row__main";

        const title =
            document.createElement("div");

        title.className =
            "admin-prompt-row__title";

        title.textContent =
            prompt.title || "Untitled";

        const id =
            document.createElement("div");

        id.className =
            "admin-prompt-row__id";

        id.textContent =
            prompt.id || "—";

        main.append(title, id);

        const category =
            document.createElement("div");

        category.className =
            "admin-prompt-row__meta";

        category.textContent =
            prompt.category || "—";

        const order =
            document.createElement("div");

        order.className =
            "admin-prompt-row__order";

        order.textContent =
            `#${Number(prompt.order) || 0}`;

        const actions =
            document.createElement("div");

        actions.className =
            "admin-prompt-row__actions";

        const status =
            document.createElement("span");

        status.className =
            "admin-prompt-row__status";

        if (prompt.published !== false) {
            status.classList.add(
                "is-published"
            );

            status.textContent =
                "Published";
        } else {
            status.textContent =
                "Unpublished";
        }

        const toggleButton =
            createRowButton(
                prompt.published !== false
                    ? "UNPUBLISH"
                    : "PUBLISH"
            );

        toggleButton.addEventListener(
            "click",
            () =>
                togglePublished(
                    prompt.id
                )
        );

        const editButton =
            createRowButton("EDIT");

        editButton.addEventListener(
            "click",
            () =>
                openEditModal(
                    prompt.id
                )
        );

        const qrButton =
            createRowButton("QR");

        qrButton.addEventListener(
            "click",
            () => openQrModal(prompt)
        );

        const deleteButton =
            createRowButton(
                "DELETE",
                "button--delete"
            );

        deleteButton.addEventListener(
            "click",
            () =>
                deletePrompt(
                    prompt.id
                )
        );

        actions.append(
            status,
            toggleButton,
            editButton,
            qrButton,
            deleteButton
        );

        row.append(
            main,
            category,
            order,
            actions
        );

        promptList.appendChild(row);
    });

    renderCategories();
    updateStorageStatus();
}


function createRowButton(
    label,
    extraClass = ""
) {
    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        `button--row ${extraClass}`.trim();

    button.textContent =
        label;

    return button;
}


function slugify(value) {
    const transliteration = {
        а: "a",
        б: "b",
        в: "v",
        г: "h",
        ґ: "g",
        д: "d",
        е: "e",
        є: "ie",
        ж: "zh",
        з: "z",
        и: "y",
        і: "i",
        ї: "yi",
        й: "i",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "kh",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "shch",
        ь: "",
        ю: "yu",
        я: "ya",
        ы: "y",
        э: "e",
        ё: "yo",
        ъ: "",
    };

    let result =
        String(value || "")
            .toLowerCase()
            .split("")
            .map(
                (character) =>
                    transliteration[
                        character
                    ] ?? character
            )
            .join("")
            .normalize("NFKD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )
            .replace(
                /-{2,}/g,
                "-"
            );

    if (!result) {
        result =
            `prompt-${getNextOrder()}`;
    }

    return result;
}


function getUniqueId(
    baseId,
    ignoredId = null
) {
    let id = baseId;
    let counter = 2;

    while (
        prompts.some(
            (prompt) =>
                prompt.id === id &&
                prompt.id !== ignoredId
        )
    ) {
        id =
            `${baseId}-${counter}`;
        counter += 1;
    }

    return id;
}


function getNextOrder() {
    if (prompts.length === 0) {
        return 1;
    }

    return (
        Math.max(
            ...prompts.map(
                (prompt) =>
                    Number(
                        prompt.order
                    ) || 0
            )
        ) + 1
    );
}


function openAddModal() {
    editingId = null;
    selectedImages = [];

    modalEyebrow.textContent =
        "ADD PROMPT";

    modalTitle.textContent =
        "New Prompt";

    promptForm.reset();

    typeInput.value =
        "vertical";
    tagsInput.value = "";
    titleUkInput.value = "";
    descriptionUkInput.value = "";
    promptUkInput.value = "";

    populateCategorySelect();

    idInput.value =
        slugify(
            titleInput.value
        );

    orderInput.value =
        String(
            getNextOrder()
        );

    publishedInput.checked =
        true;

    clearImage();

    openModal();
}


function openEditModal(id) {
    const prompt =
        prompts.find(
            (item) =>
                item.id === id
        );

    if (!prompt) {
        return;
    }

    editingId = id;
    selectedImages = normalizeImages(prompt);

    modalEyebrow.textContent =
        "EDIT PROMPT";

    modalTitle.textContent =
        "Edit Prompt";

    titleInput.value =
        prompt.title || "";

    titleUkInput.value = prompt.translations?.uk?.title || "";

    idInput.value =
        prompt.id || "";

    typeInput.value =
        prompt.type ||
        "vertical";

    populateCategorySelect(
        prompt.category || ""
    );

    renderImageEditor();

    descriptionInput.value =
        prompt.description || "";

    descriptionUkInput.value = prompt.translations?.uk?.description || "";

    promptInput.value =
        prompt.prompt || "";

    promptUkInput.value = prompt.translations?.uk?.prompt || "";

    tagsInput.value = Array.isArray(prompt.tags) ? prompt.tags.join(", ") : "";

    publishedInput.checked =
        prompt.published !== false;

    orderInput.value =
        String(
            Math.max(
                1,
                Number(prompt.order) ||
                    1
            )
        );

    renderImageEditor();

    openModal();
}


function openModal() {
    modal.classList.add("is-open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "is-hidden";

    titleInput.focus();
}


function closeModal() {
    modal.classList.remove("is-open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    editingId = null;
    selectedImages = [];
}


function normalizeImages(prompt) {
    if (Array.isArray(prompt?.images)) {
        return prompt.images
            .filter(Boolean)
            .map((item, index) =>
                typeof item === "string"
                    ? {
                        src: item,
                        name: `Master image ${index + 1}`
                    }
                    : {
                        id: item.id || "",
                        src: item.src || item.image || "",
                        name: item.name || `Master image ${index + 1}`
                    }
            )
            .filter((item) => item.src || item.id);
    }

    if (prompt?.image) {
        return [{
            src: prompt.image,
            name: "Master image 1"
        }];
    }

    return [];
}


async function renderImageEditor() {
    imageGalleryEditor.replaceChildren();

    if (!selectedImages.length) {
        imageGalleryEditor.classList.add("is-hidden");
        imageEmptyState.classList.remove("is-hidden");
        return;
    }

    imageEmptyState.classList.add("is-hidden");
    imageGalleryEditor.classList.remove("is-hidden");

    const snapshot = [...selectedImages];

    for (let index = 0; index < snapshot.length; index += 1) {
        const item = snapshot[index];
        let src = getImageSrc(item);

        if (!src && item.id) {
            src = await getStoredImage(item.id);
        }

        // The editor may have changed while IndexedDB was loading.
        if (snapshot[index] !== selectedImages[index]) continue;

        const card = document.createElement("div");
        card.className = "image-uploader__card";

        const img = document.createElement("img");
        img.src = src || "";
        img.alt = item.name || `Master image ${index + 1}`;

        const meta = document.createElement("div");
        meta.className = "image-uploader__card-meta";

        const name = document.createElement("span");
        name.className = "image-uploader__card-name";
        name.textContent = item.name || `Master image ${index + 1}`;
        name.title = name.textContent;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "image-uploader__remove";
        remove.textContent = "REMOVE";
        remove.addEventListener("click", (event) => {
            event.stopPropagation();
            const currentIndex = selectedImages.indexOf(item);
            if (currentIndex !== -1) selectedImages.splice(currentIndex, 1);
            renderImageEditor();
        });

        meta.append(name, remove);
        card.append(img, meta);
        imageGalleryEditor.appendChild(card);
    }
}


function addImageFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please choose image files only.");
        return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
        const wasEmpty = selectedImages.length === 0;
        selectedImages.push({
            src: reader.result,
            name: file.name
        });
        renderImageEditor();
        if (wasEmpty) autoDetectType();
    });

    reader.addEventListener("error", () => {
        alert("The image could not be read.");
    });

    reader.readAsDataURL(file);
}


function buildPromptFromForm() {
    const formData = new FormData(promptForm);
    const title = String(formData.get("title") || "").trim();
    const tags = String(formData.get("tags") || "").split(",").map(item => item.trim()).filter(Boolean);
    return {
        id: editingId || getUniqueId(slugify(title)),
        title,
        type: formData.get("type"),
        category: getSelectedCategory(),
        tags,
        description: String(formData.get("description") || "").trim(),
        images: selectedImages.map(item => ({ id: item.id || "", src: item.src || "", name: item.name || "" })),
        prompt: formData.get("prompt") || "",
        translations: {
            uk: {
                title: titleUkInput.value.trim(),
                description: descriptionUkInput.value.trim(),
                prompt: promptUkInput.value || ""
            }
        },
        createdAt: getExistingCreatedAt(),
        published: publishedInput.checked,
        order: Math.max(1, Number(formData.get("order")) || 1),
        copyCount: getExistingCopyCount()
    };
}

function getExistingCreatedAt() {
    if (editingId) {
        const existing =
            prompts.find(
                (prompt) =>
                    prompt.id ===
                    editingId
            );

        if (
            existing &&
            existing.createdAt
        ) {
            return existing.createdAt;
        }
    }

    return new Date()
        .toISOString()
        .slice(0, 10);
}


function getExistingCopyCount() {
    if (editingId) {
        const existing =
            prompts.find(
                (prompt) =>
                    prompt.id ===
                    editingId
            );

        if (
            existing &&
            Number.isFinite(
                Number(
                    existing.copyCount
                )
            )
        ) {
            return Number(
                existing.copyCount
            );
        }
    }

    return 0;
}


function applyOrderChange(
    newOrder,
    currentId = null
) {
    const targetOrder =
        Math.max(
            1,
            Number(newOrder) || 1
        );

    if (!currentId) {
        return targetOrder;
    }

    const currentPrompt =
        prompts.find(
            (prompt) =>
                prompt.id === currentId
        );

    if (!currentPrompt) {
        return targetOrder;
    }

    const oldOrder =
        Math.max(
            1,
            Number(
                currentPrompt.order
            ) || 1
        );

    if (oldOrder === targetOrder) {
        return targetOrder;
    }

    if (targetOrder < oldOrder) {
        prompts.forEach(
            (prompt) => {
                const order =
                    Math.max(
                        1,
                        Number(
                            prompt.order
                        ) || 1
                    );

                if (
                    prompt.id !==
                        currentId &&
                    order >=
                        targetOrder &&
                    order < oldOrder
                ) {
                    prompt.order =
                        order + 1;
                }
            }
        );
    } else {
        prompts.forEach(
            (prompt) => {
                const order =
                    Math.max(
                        1,
                        Number(
                            prompt.order
                        ) || 1
                    );

                if (
                    prompt.id !==
                        currentId &&
                    order >
                        oldOrder &&
                    order <=
                        targetOrder
                ) {
                    prompt.order =
                        order - 1;
                }
            }
        );
    }

    return targetOrder;
}


async function savePrompt(event) {
    event.preventDefault();

    if (!promptForm.reportValidity()) {
        return;
    }

    const category =
        getSelectedCategory();

    if (!category) {
        alert(
            "Please choose a category."
        );

        return;
    }

    const prompt =
        buildPromptFromForm();

    try {
        await persistPromptImages(prompt);
    } catch (error) {
        console.error("Could not store prompt images:", error);
        alert("The images could not be stored. Please try again or use smaller images.");
        return;
    }

    if (editingId) {
        const index =
            prompts.findIndex(
                (item) =>
                    item.id ===
                    editingId
            );

        if (index === -1) {
            return;
        }

        prompt.order =
            applyOrderChange(
                prompt.order,
                editingId
            );

        prompts[index] =
            prompt;
    } else {
        const requestedOrder =
            Math.max(
                1,
                Number(
                    prompt.order
                ) || 1
            );

        prompts.forEach(
            (item) => {
                const order =
                    Math.max(
                        1,
                        Number(
                            item.order
                        ) || 1
                    );

                if (
                    order >=
                    requestedOrder
                ) {
                    item.order =
                        order + 1;
                }
            }
        );

        prompt.order =
            requestedOrder;

        prompts.push(prompt);
    }

    saveLocalData();

    renderPrompts();
    closeModal();
}


function togglePublished(id) {
    const prompt =
        prompts.find(
            (item) =>
                item.id === id
        );

    if (!prompt) {
        return;
    }

    prompt.published =
        prompt.published === false;

    saveLocalData();

    renderPrompts();
}


function deletePrompt(id) {
    const prompt =
        prompts.find(
            (item) =>
                item.id === id
        );

    if (!prompt) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${prompt.title}"?\n\nThis action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    prompts =
        prompts.filter(
            (item) =>
                item.id !== id
        );

    /*
     * Keep order values contiguous
     * after a deletion.
     */
    sortPrompts();

    prompts.forEach(
        (item, index) => {
            item.order =
                index + 1;
        }
    );

    saveLocalData();

    renderPrompts();
}


async function exportJson() {
    sortPrompts();
    const exportPrompts = [];
    for (const prompt of prompts) {
        const copy = JSON.parse(JSON.stringify(prompt));
        copy.images = [];
        for (const item of normalizeImages(prompt)) {
            const src = await getStoredImage(item.id) || item.src || "";
            if (src) copy.images.push(src);
        }
        exportPrompts.push(copy);
    }

    const json = JSON.stringify(exportPrompts, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prompts.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}


function resetLocalData() {
    const confirmed =
        window.confirm(
            "Reset local admin data to data/prompts.json?\n\nAll local prompt and category changes will be lost."
        );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        STORAGE_KEY
    );

    localStorage.removeItem(
        CATEGORY_STORAGE_KEY
    );

    clearStoredImages().finally(() => window.location.reload());
}


function detectTypeFromImageSource(src) {
    return new Promise((resolve) => {
        if (!src) { resolve(null); return; }
        const image = new Image();
        image.onload = () => {
            if (!image.naturalWidth || !image.naturalHeight) { resolve(null); return; }
            const ratio = image.naturalWidth / image.naturalHeight;
            if (Math.abs(ratio - 1) < 0.05) resolve("square");
            else resolve(ratio > 1 ? "horizontal" : "vertical");
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
}

async function autoDetectType() {
    const first = getImageSrc(selectedImages[0]);
    if (!first) { alert("Add a master image first."); return; }
    const detected = await detectTypeFromImageSource(first);
    if (!detected) { alert("Could not detect the image orientation."); return; }
    typeInput.value = detected;
}


/*
 * IMAGE
 */

function clearImage() {
    selectedImages = [];
    imageFileInput.value = "";
    renderImageEditor();
}


function handleImageFiles(files) {
    Array.from(files || []).forEach(addImageFile);
}


/*
 * QR
 */

function getPromptUrl(prompt) {
    return new URL(
        `prompt.html?id=${encodeURIComponent(prompt.id)}`,
        window.location.href
    ).href;
}


function openQrModal(prompt) {
    activeQrPrompt = prompt;
    const url = getPromptUrl(prompt);

    qrPromptTitle.textContent = prompt.title || prompt.id;
    qrUrlInput.value = url;
    qrCode.replaceChildren();

    if (typeof qrcode === "function") {
        const qr = qrcode(0, "M");
        qr.addData(url);
        qr.make();
        qrCode.innerHTML = qr.createSvgTag(5, 0);
    } else {
        const fallback = document.createElement("p");
        fallback.textContent = "QR library could not be loaded. The link is still available below.";
        fallback.className = "qr-modal__help";
        qrCode.appendChild(fallback);
    }

    qrModal.classList.add("is-open");
    qrModal.setAttribute("aria-hidden", "false");
}


function closeQrModal() {
    qrModal.classList.remove("is-open");
    qrModal.setAttribute("aria-hidden", "true");
    activeQrPrompt = null;
}


async function copyQrUrl() {
    try {
        await navigator.clipboard.writeText(qrUrlInput.value);
        copyQrUrlButton.textContent = "COPIED ✓";
        setTimeout(() => copyQrUrlButton.textContent = "COPY LINK", 1500);
    } catch (error) {
        qrUrlInput.select();
        document.execCommand("copy");
        copyQrUrlButton.textContent = "COPIED ✓";
        setTimeout(() => copyQrUrlButton.textContent = "COPY LINK", 1500);
    }
}


function downloadQr() {
    const svg = qrCode.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeQrPrompt?.id || "prompt"}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}


/*
 * EVENTS
 */

addPromptButton.addEventListener(
    "click",
    openAddModal
);

addCategoryButton.addEventListener(
    "click",
    () =>
        openAddCategoryModal(false)
);

newCategoryFromFormButton.addEventListener(
    "click",
    () =>
        openAddCategoryModal(true)
);

exportButton.addEventListener(
    "click",
    exportJson
);

resetButton.addEventListener(
    "click",
    resetLocalData
);

closeModalButton.addEventListener(
    "click",
    closeModal
);

cancelButton.addEventListener(
    "click",
    closeModal
);

modal.addEventListener(
    "click",
    (event) => {
        if (
            event.target.matches(
                "[data-close-modal]"
            )
        ) {
            closeModal();
        }
    }
);

promptForm.addEventListener(
    "submit",
    savePrompt
);

closeCategoryModalButton.addEventListener(
    "click",
    closeCategoryModal
);

cancelCategoryButton.addEventListener(
    "click",
    closeCategoryModal
);

categoryForm.addEventListener(
    "submit",
    saveCategory
);

categoryModal.addEventListener(
    "click",
    (event) => {
        if (
            event.target.matches(
                "[data-close-category-modal]"
            )
        ) {
            closeCategoryModal();
        }
    }
);

closeCategoryActionModalButton.addEventListener(
    "click",
    closeCategoryActionModal
);

cancelCategoryActionButton.addEventListener(
    "click",
    closeCategoryActionModal
);

confirmCategoryActionButton.addEventListener(
    "click",
    confirmCategoryAction
);

categoryActionModal.addEventListener(
    "click",
    (event) => {
        if (
            event.target.matches(
                "[data-close-category-action-modal]"
            )
        ) {
            closeCategoryActionModal();
        }
    }
);

closeMovePromptsButton.addEventListener("click", closeMovePromptsModal);
cancelMovePromptsButton.addEventListener("click", closeMovePromptsModal);
confirmMovePromptsButton.addEventListener("click", confirmSelectiveMove);
selectAllMoveButton.addEventListener("click", () => {
    if (!moveSourceCategory) return;
    prompts.forEach((prompt) => {
        if (normalizeCategoryName(prompt.category).toLowerCase() === moveSourceCategory.toLowerCase()) {
            selectedMovePromptIds.add(prompt.id);
        }
    });
    renderMovePromptGrid();
});
clearMoveSelectionButton.addEventListener("click", () => {
    selectedMovePromptIds = new Set();
    renderMovePromptGrid();
});
moveTargetCategorySelect.addEventListener("change", updateMoveSelectionUI);
movePromptsModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-move-modal]")) closeMovePromptsModal();
});

closeQrModalButton.addEventListener("click", closeQrModal);
copyQrUrlButton.addEventListener("click", copyQrUrl);
downloadQrButton.addEventListener("click", downloadQr);
qrModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-qr-modal]")) closeQrModal();
});

detectTypeButton.addEventListener("click", autoDetectType);

titleInput.addEventListener(
    "input",
    () => {
        if (!editingId) {
            idInput.value =
                slugify(
                    titleInput.value
                );
        }
    }
);

imageDropzone.addEventListener(
    "click",
    () => imageFileInput.click()
);

imageDropzone.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();
            imageFileInput.click();
        }
    }
);

imageFileInput.addEventListener(
    "change",
    () => handleImageFiles(imageFileInput.files)
);

["dragenter", "is-dragover"].forEach(
    (eventName) => {
        imageDropzone.addEventListener(
            eventName,
            (event) => {
                event.preventDefault();

                imageDropzone.classList.add(
                    "is-dragover"
                );
            }
        );
    }
);

["dragleave", "drop"].forEach(
    (eventName) => {
        imageDropzone.addEventListener(
            eventName,
            (event) => {
                event.preventDefault();

                imageDropzone.classList.remove(
                    "is-dragover"
                );
            }
        );
    }
);

imageDropzone.addEventListener(
    "drop",
    (event) => handleImageFiles(event.dataTransfer.files)
);


document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape" &&
            modal.classList.contains("is-open")
        ) {
            closeModal();
        }

        if (
            event.key === "Escape" &&
            categoryModal.classList.contains(
                "is-open"
            )
        ) {
            closeCategoryModal();
        }
    }
);


async function init() {
    await loadInitialPrompts();

    loadCategories();

    renderCategories();
    populateCategorySelect();
    renderPrompts();
}


init();
