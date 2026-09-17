const promptGrid = document.getElementById("promptGrid");
const promptCount = document.getElementById("promptCount");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");
const emptyResults = document.getElementById("emptyResults");
const languageToggle = document.getElementById("languageToggle");

const I18N = {
    en: {
        heroEyebrow: "CREATIVE PROMPT LIBRARY", heroTitle: "Turn your ideas<br>into visual worlds.", heroDescription: "A collection of experimental AI prompts, visual references and creative workflows.",
        collectionEyebrow: "COLLECTION", collectionTitle: "Prompts", promptsLabel: "prompts", allCategories: "All categories", allTypes: "All formats", vertical: "Vertical", horizontal: "Horizontal", square: "Square",
        sortCurated: "Curated", sortNewest: "Newest", sortTitle: "Title", searchPlaceholder: "Search title, tags or description...", noResultsTitle: "No prompts found.", noResultsText: "Try another category, format or search term.",
        aboutEyebrow: "ABOUT", aboutTitle: "Experimental visual library.", aboutText: "Original prompts, master references and creative workflows collected in one place.",
        supportTitle: "Enjoyed a prompt?", supportText: "The library is built to stay useful and accessible. Support options will be connected when the public backend is ready.", supportSoon: "SUPPORT COMING SOON", footerText: "Prompt Library",
        viewPrompt: "VIEW PROMPT", images: "images", image: "image", previous: "Previous image", next: "Next image"
    },
    uk: {
        heroEyebrow: "КРЕАТИВНА БІБЛІОТЕКА ПРОМТІВ", heroTitle: "Перетворюй ідеї<br>на візуальні світи.", heroDescription: "Колекція експериментальних AI-промтів, візуальних референсів і творчих workflow.",
        collectionEyebrow: "КОЛЕКЦІЯ", collectionTitle: "Промти", promptsLabel: "промтів", allCategories: "Усі категорії", allTypes: "Усі формати", vertical: "Вертикальне", horizontal: "Горизонтальне", square: "Квадрат",
        sortCurated: "За порядком", sortNewest: "Новіші", sortTitle: "За назвою", searchPlaceholder: "Пошук за назвою, тегами або описом...", noResultsTitle: "Промтів не знайдено.", noResultsText: "Спробуй іншу категорію, формат або пошуковий запит.",
        aboutEyebrow: "ПРО ПРОЄКТ", aboutTitle: "Експериментальна візуальна бібліотека.", aboutText: "Оригінальні промти, master-референси та творчі workflow в одному місці.",
        supportTitle: "Сподобався промт?", supportText: "Бібліотека створюється як корисний і доступний ресурс. Донат-функції будуть підключені разом із публічним backend.", supportSoon: "ПІДТРИМКА НЕЗАБАРОМ", footerText: "Бібліотека промтів",
        viewPrompt: "ВІДКРИТИ ПРОМТ", images: "зображень", image: "зображення", previous: "Попереднє зображення", next: "Наступне зображення"
    }
};

let currentLanguage = localStorage.getItem("artistic.language") || "en";
let allPrompts = [];
let carouselCleanups = [];

function text(value, lang = currentLanguage) {
    if (value && typeof value === "object") return value[lang] || value.en || value.uk || Object.values(value)[0] || "";
    return String(value || "");
}
function getImages(prompt) { return Array.isArray(prompt.images) && prompt.images.length ? prompt.images : (prompt.image ? [prompt.image] : []); }
function imageSrc(item) { return typeof item === "string" ? item : item?.src || ""; }
function normalizeType(type) { const value = String(type || "").toLowerCase(); return ["vertical", "horizontal", "square"].includes(value) ? value : ""; }

function setLanguage(lang) {
    currentLanguage = lang === "uk" ? "uk" : "en";
    localStorage.setItem("artistic.language", currentLanguage);
    document.documentElement.lang = currentLanguage;
    document.querySelectorAll("[data-i18n]").forEach(el => { const key = el.dataset.i18n; if (I18N[currentLanguage][key]) el.innerHTML = I18N[currentLanguage][key]; });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { const key = el.dataset.i18nPlaceholder; if (I18N[currentLanguage][key]) el.placeholder = I18N[currentLanguage][key]; });
    languageToggle?.querySelectorAll("[data-lang]").forEach(el => el.classList.toggle("is-active", el.dataset.lang === currentLanguage));
    renderCategoryOptions();
    renderPrompts();
}

function renderCategoryOptions() {
    const current = categoryFilter.value;
    const categories = [...new Set(allPrompts.map(p => String(p.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    categoryFilter.replaceChildren();
    const all = document.createElement("option"); all.value = ""; all.textContent = I18N[currentLanguage].allCategories; categoryFilter.appendChild(all);
    categories.forEach(category => { const option = document.createElement("option"); option.value = category; option.textContent = category; categoryFilter.appendChild(option); });
    categoryFilter.value = categories.includes(current) ? current : "";
}

function searchableText(prompt) {
    return [text(prompt.title), text(prompt.description), prompt.category, prompt.type, ...(Array.isArray(prompt.tags) ? prompt.tags : [])].join(" ").toLowerCase();
}
function getFilteredPrompts() {
    const category = categoryFilter.value.toLowerCase();
    const type = typeFilter.value;
    const query = searchInput.value.trim().toLowerCase();
    const list = allPrompts.filter(prompt => {
        if (prompt.published === false) return false;
        if (category && String(prompt.category || "").toLowerCase() !== category) return false;
        if (type && normalizeType(prompt.type) !== type) return false;
        return !query || searchableText(prompt).includes(query);
    });
    if (sortFilter.value === "newest") list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    else if (sortFilter.value === "title") list.sort((a, b) => text(a.title).localeCompare(text(b.title)));
    else list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return list;
}

function cleanupCarousels() { carouselCleanups.forEach(cleanup => cleanup()); carouselCleanups = []; }
function preloadImages(images) { images.slice(0, 8).forEach(item => { const img = new Image(); img.src = imageSrc(item); }); }

function startCardCarousel(card, prompt, images) {
    if (images.length < 2) return;
    preloadImages(images);
    const media = card.querySelector(".prompt-card__media");
    const image = card.querySelector(".prompt-card__image");
    const dots = [...card.querySelectorAll(".prompt-card__dot")];
    const prev = card.querySelector(".prompt-card__arrow--previous");
    const next = card.querySelector(".prompt-card__arrow--next");
    let index = 0;
    let timer = null;
    let touchStartX = null;
    let paused = false;

    function updateRatio() {
        if (image.naturalWidth && image.naturalHeight) media.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
    }
    function show(nextIndex, animate = true) {
        index = (nextIndex + images.length) % images.length;
        if (animate) image.classList.add("is-changing");
        image.onload = () => { updateRatio(); requestAnimationFrame(() => image.classList.remove("is-changing")); };
        image.src = imageSrc(images[index]);
        image.alt = text(prompt.title);
        dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function start() { stop(); if (!paused) timer = setInterval(() => show(index + 1), 4000); }
    function togglePause(value) { paused = value; if (paused) stop(); else start(); }

    image.addEventListener("load", updateRatio);
    dots.forEach((dot, i) => dot.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); show(i); start(); }));
    prev?.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); show(index - 1); start(); });
    next?.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); show(index + 1); start(); });
    card.addEventListener("mouseenter", () => togglePause(true));
    card.addEventListener("mouseleave", () => togglePause(false));
    media.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    media.addEventListener("touchend", e => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 35) { show(index + (dx < 0 ? 1 : -1)); start(); }
        touchStartX = null;
    }, { passive: true });

    start();
    carouselCleanups.push(() => stop());
}

function renderPrompts() {
    cleanupCarousels();
    const prompts = getFilteredPrompts();
    promptCount.textContent = prompts.length;
    promptGrid.replaceChildren();
    emptyResults.classList.toggle("is-hidden", prompts.length !== 0);

    prompts.forEach(prompt => {
        const card = document.createElement("article"); card.className = "prompt-card";
        const images = getImages(prompt);
        const media = document.createElement("div"); media.className = "prompt-card__media";
        const image = document.createElement("img"); image.className = "prompt-card__image"; image.src = imageSrc(images[0] || ""); image.alt = text(prompt.title); image.loading = "lazy";
        media.appendChild(image);

        if (images.length > 1) {
            const prev = document.createElement("button"); prev.type = "button"; prev.className = "prompt-card__arrow prompt-card__arrow--previous"; prev.textContent = "‹"; prev.setAttribute("aria-label", I18N[currentLanguage].previous);
            const next = document.createElement("button"); next.type = "button"; next.className = "prompt-card__arrow prompt-card__arrow--next"; next.textContent = "›"; next.setAttribute("aria-label", I18N[currentLanguage].next);
            media.append(prev, next);
            const dots = document.createElement("div"); dots.className = "prompt-card__dots";
            images.forEach((_, i) => { const d = document.createElement("button"); d.type = "button"; d.className = `prompt-card__dot${i === 0 ? " active" : ""}`; d.setAttribute("aria-label", `${i + 1}`); dots.appendChild(d); });
            media.appendChild(dots);
            const count = document.createElement("span"); count.className = "prompt-card__image-count"; count.textContent = `${images.length} ${I18N[currentLanguage].images}`; media.appendChild(count);
        }

        const content = document.createElement("div"); content.className = "prompt-card__content";
        const category = document.createElement("div"); category.className = "prompt-card__category"; category.textContent = prompt.category || "";
        const title = document.createElement("h3"); title.className = "prompt-card__title"; title.textContent = text(prompt.title);
        const description = document.createElement("p"); description.className = "prompt-card__description"; description.textContent = text(prompt.description);
        const link = document.createElement("a"); link.className = "prompt-card__link"; link.href = `prompt.html?id=${encodeURIComponent(prompt.id)}`; link.textContent = I18N[currentLanguage].viewPrompt;
        content.append(category, title, description, link); card.append(media, content); promptGrid.appendChild(card);
        if (images.length > 1) startCardCarousel(card, prompt, images);
    });
}

async function loadPrompts() {
    try {
        const response = await fetch("data/prompts.json", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        allPrompts = await response.json();
        renderCategoryOptions(); renderPrompts();
    } catch (error) {
        console.error("Failed to load prompt library:", error);
        promptGrid.innerHTML = `<p>Failed to load prompt library.</p>`;
    }
}

[categoryFilter, typeFilter, sortFilter].forEach(el => el.addEventListener("change", renderPrompts));
searchInput.addEventListener("input", renderPrompts);
languageToggle?.addEventListener("click", () => setLanguage(currentLanguage === "en" ? "uk" : "en"));
setLanguage(currentLanguage);
loadPrompts();
