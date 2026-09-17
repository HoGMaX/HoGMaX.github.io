const promptContent = document.getElementById("promptContent");
const languageToggle = document.getElementById("promptLanguageToggle");
let currentLanguage = localStorage.getItem("artistic.language") || "en";

const UI = {
    en:{back:"← BACK TO LIBRARY", download:"DOWNLOAD", copy:"COPY PROMPT", copied:"COPIED", master:"MASTER REFERENCE", guideTitle:"HOW TO USE", guide:["Open the image generator you use.","Download the master reference image you need from the gallery below.","Add the reference image to your generation workflow.","Copy the prompt below and adapt it to your model if needed."], previous:"Previous master image", next:"Next master image", noImage:"No master image available."},
    uk:{back:"← НАЗАД ДО БІБЛІОТЕКИ", download:"ЗАВАНТАЖИТИ", copy:"КОПІЮВАТИ ПРОМТ", copied:"СКОПІЙОВАНО", master:"МАЙСТЕР-РЕФЕРЕНС", guideTitle:"ЯК ВИКОРИСТОВУВАТИ", guide:["Відкрий генератор зображень, яким ти користуєшся.","Завантаж потрібне master-зображення з галереї нижче.","Додай референс до свого workflow генерації.","Скопіюй промт нижче та за потреби адаптуй його під свою модель."], previous:"Попереднє master-зображення", next:"Наступне master-зображення", noImage:"Master-зображення недоступне."}
};
function t(value){if(value&&typeof value==="object")return value[currentLanguage]||value.en||value.uk||Object.values(value)[0]||"";return String(value||"")}
function imagesOf(prompt){return Array.isArray(prompt.images)&&prompt.images.length?prompt.images:(prompt.image?[prompt.image]:[])}
function srcOf(item){return typeof item==="string"?item:item?.src||""}
function nameOf(item,i){return typeof item==="string"?`Master image ${i+1}`:item?.name||`Master image ${i+1}`}
function getPromptId(){return new URLSearchParams(window.location.search).get("id")}
function setLanguage(lang){currentLanguage=lang==="uk"?"uk":"en";localStorage.setItem("artistic.language",currentLanguage);document.documentElement.lang=currentLanguage;if(languageToggle)languageToggle.querySelectorAll("[data-lang]").forEach(el=>el.classList.toggle("is-active",el.dataset.lang===currentLanguage));loadPrompt()}

async function loadPrompt(){
    const id=getPromptId(); if(!id){showError("Prompt ID is missing.");return}
    try{const response=await fetch("data/prompts.json",{cache:"no-store"});if(!response.ok)throw new Error(`HTTP error: ${response.status}`);const prompts=await response.json();const prompt=prompts.find(item=>item.id===id);if(!prompt){showError("Prompt not found.");return}renderPrompt(prompt)}catch(error){console.error(error);showError("Failed to load prompt.")}
}

function renderPrompt(prompt){
    document.title=`${t(prompt.title)} — Artistic`;promptContent.replaceChildren();
    const top=document.createElement("div");top.className="prompt-page__topbar";const back=document.createElement("a");back.href="./";back.className="prompt-page__back";back.textContent=UI[currentLanguage].back;top.appendChild(back);const category=document.createElement("div");category.className="prompt-page__category";category.textContent=prompt.category||"";top.appendChild(category);promptContent.appendChild(top);
    const header=document.createElement("header");header.className="prompt-page__header";const title=document.createElement("h1");title.className="prompt-page__title";title.textContent=t(prompt.title);const description=document.createElement("p");description.className="prompt-page__description";description.textContent=t(prompt.description);header.append(title,description);promptContent.appendChild(header);

    const images=imagesOf(prompt);const gallery=document.createElement("section");gallery.className="prompt-gallery";
    if(images.length){
        images.forEach(item=>{const pre=new Image();pre.src=srcOf(item)});
        const main=document.createElement("div");main.className="prompt-gallery__main";const image=document.createElement("img");image.className="prompt-gallery__image";image.loading="eager";
        const controls=document.createElement("div");controls.className="prompt-gallery__controls";const prev=document.createElement("button");prev.className="prompt-gallery__arrow prompt-gallery__arrow--previous";prev.type="button";prev.textContent="←";prev.setAttribute("aria-label",UI[currentLanguage].previous);const counter=document.createElement("span");counter.className="prompt-gallery__counter";const next=document.createElement("button");next.className="prompt-gallery__arrow prompt-gallery__arrow--next";next.type="button";next.textContent="→";next.setAttribute("aria-label",UI[currentLanguage].next);controls.append(prev,counter,next);main.append(image,controls);
        const thumbs=document.createElement("div");thumbs.className="prompt-gallery__thumbnails";const downloads=document.createElement("div");downloads.className="prompt-gallery__downloads";let active=0;let touchStartX=null;
        function renderGallery(animate=true){
            const current=images[active];
            if(animate) image.classList.add("is-changing");
            image.onload=()=>{if(image.naturalWidth&&image.naturalHeight)main.style.aspectRatio=`${image.naturalWidth} / ${image.naturalHeight}`;requestAnimationFrame(()=>image.classList.remove("is-changing"))};
            image.src=srcOf(current);image.alt=nameOf(current,active);counter.textContent=`${active+1} / ${images.length}`;prev.disabled=images.length<2;next.disabled=images.length<2;
            thumbs.replaceChildren();downloads.replaceChildren();
            images.forEach((item,i)=>{const b=document.createElement("button");b.type="button";b.className=`prompt-gallery__thumbnail${i===active?" is-active":""}`;const im=document.createElement("img");im.src=srcOf(item);im.alt=nameOf(item,i);im.loading="lazy";b.appendChild(im);b.addEventListener("click",()=>{if(i!==active){active=i;renderGallery(true)}});thumbs.appendChild(b);const a=document.createElement("a");a.className="prompt-gallery__download";a.href=srcOf(item);a.download=nameOf(item,i);a.target="_blank";a.rel="noopener";a.textContent=`${UI[currentLanguage].download} ${String(i+1).padStart(2,"0")}`;downloads.appendChild(a)});
        }
        function change(delta){active=(active+delta+images.length)%images.length;renderGallery(true)}
        prev.addEventListener("click",()=>change(-1));next.addEventListener("click",()=>change(1));
        main.addEventListener("touchstart",e=>{touchStartX=e.changedTouches[0].clientX},{passive:true});
        main.addEventListener("touchend",e=>{if(touchStartX===null)return;const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>45)change(dx<0?1:-1);touchStartX=null},{passive:true});
        gallery.append(main,thumbs,downloads);renderGallery(false);
    }else{const empty=document.createElement("div");empty.className="prompt-gallery__empty";empty.textContent=UI[currentLanguage].noImage;gallery.appendChild(empty)}
    promptContent.appendChild(gallery);

    const guide=document.createElement("section");guide.className="prompt-guide";const guideTitle=document.createElement("h2");guideTitle.textContent=UI[currentLanguage].guideTitle;const list=document.createElement("ol");UI[currentLanguage].guide.forEach(item=>{const li=document.createElement("li");li.textContent=item;list.appendChild(li)});guide.append(guideTitle,list);promptContent.appendChild(guide);
    const promptSection=document.createElement("section");promptSection.className="prompt-box-section";const promptLabel=document.createElement("div");promptLabel.className="prompt-box-section__label";promptLabel.textContent="PROMPT";const box=document.createElement("div");box.className="prompt-box";const copy=document.createElement("button");copy.className="prompt-box__copy-button";copy.type="button";copy.innerHTML=`<span class="copy-icon">⧉</span><span>${UI[currentLanguage].copy}</span>`;const code=document.createElement("pre");code.textContent=t(prompt.prompt);
    copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(t(prompt.prompt));copy.classList.add("is-copied");copy.innerHTML=`<span class="copy-check">✓</span><span>${UI[currentLanguage].copied}</span>`;setTimeout(()=>{copy.classList.remove("is-copied");copy.innerHTML=`<span class="copy-icon">⧉</span><span>${UI[currentLanguage].copy}</span>`},1700)}catch(e){console.error(e);}});box.append(copy,code);promptSection.append(promptLabel,box);promptContent.appendChild(promptSection);
    const support=document.createElement("section");support.className="prompt-support";support.innerHTML=currentLanguage==="en"?"<strong>Enjoyed this prompt?</strong><span>Support options will be connected soon.</span>":"<strong>Сподобався цей промт?</strong><span>Донат-функції будуть підключені найближчим часом.</span>";promptContent.appendChild(support);
}
function showError(message){promptContent.innerHTML=`<div class="prompt-error">${message}</div>`}
languageToggle?.addEventListener("click",()=>setLanguage(currentLanguage==="en"?"uk":"en"));
setLanguage(currentLanguage);
