// assets/js/modal.js

let loadedPropertyData = [];
let currentModalGalleryIndex = 0;

const propertyModalEl = document.getElementById('propertyModal');

// Zmienne dla elementów wewnętrznych modala - zostaną przypisane w initializeModalLogic
let closeModalBtn, modalContentBox, modalMainImageEl, modalThumbnailsContainerEl, modalGalleryPrevBtn, modalGalleryNextBtn;
let enhanceDescriptionBtn, enhancedDescriptionOutput, enhancedDescriptionLoader, enhancedDescriptionText;
let neighborhoodInsightsBtn, neighborhoodInsightsOutput, neighborhoodInsightsLoader, neighborhoodInsightsText;
let interiorDesignBtn, interiorDesignOutput, interiorDesignLoader, interiorDesignText;
let investmentAnalysisBtn, investmentAnalysisOutput, investmentAnalysisLoader, investmentAnalysisText;

let currentPropertyDataForGemini = null;
let staticModalListenersAttached = false; // Flaga do jednorazowego podpięcia listenerów statycznych elementów modala

async function loadAndStoreProperties() {
    if (loadedPropertyData.length > 0) { return loadedPropertyData; }
    try {
        const response = await fetch('data/properties.json');
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const data = await response.json();
        loadedPropertyData = data;
        console.log("Dane nieruchomości wczytane z JSON (modal.js):", loadedPropertyData);
        return loadedPropertyData;
    } catch (error) {
        console.error("Nie udało się wczytać danych nieruchomości z properties.json (modal.js):", error);
        if(typeof localPropertyDataFallback !== 'undefined') { loadedPropertyData = localPropertyDataFallback; return loadedPropertyData;}
        return [];
    }
}

function getPropertyByIndex(index) {
    if (index === null || index === undefined || index < 0 || index >= loadedPropertyData.length) {
        console.error(`Nieprawidłowy indeks nieruchomości: ${index}. Dostępnych ofert: ${loadedPropertyData.length}`);
        return null;
    }
    return loadedPropertyData[index];
}

function updateModalGalleryImage(images, index) {
    if (!modalMainImageEl || !images || images.length === 0) {
        // console.warn("updateModalGalleryImage: Brak elementów DOM lub obrazów do aktualizacji galerii.");
        return;
    }
    modalMainImageEl.style.opacity = '0';
    setTimeout(() => {
        modalMainImageEl.src = images[index];
        modalMainImageEl.alt = `Zdjęcie ${index + 1} dla ${currentPropertyDataForGemini ? currentPropertyDataForGemini.title : 'nieruchomości'}`;
        modalMainImageEl.onerror = function() { this.src='https://placehold.co/800x600/cccccc/333333?text=Brak+obrazu'; };
        modalMainImageEl.style.opacity = '1';
    }, 150);
    currentModalGalleryIndex = index;
    if (modalThumbnailsContainerEl) {
        const thumbnails = modalThumbnailsContainerEl.querySelectorAll('img');
        thumbnails.forEach((thumb, i) => {
            const isActive = i === index;
            thumb.classList.toggle('border-primary', isActive && !document.documentElement.classList.contains('dark'));
            thumb.classList.toggle('dark:border-accent', isActive && document.documentElement.classList.contains('dark'));
            thumb.classList.toggle('ring-2', isActive);
            thumb.classList.toggle('ring-primary', isActive && !document.documentElement.classList.contains('dark'));
            thumb.classList.toggle('dark:ring-accent', isActive && document.documentElement.classList.contains('dark'));
            thumb.classList.toggle('opacity-60', !isActive);
            thumb.classList.toggle('hover:opacity-100', !isActive);
        });
    }
}

function setupModalGallery(propertyData) {
    if (!propertyModalEl) return;
    const images = propertyData && propertyData.galleryImages && propertyData.galleryImages.length > 0 ? propertyData.galleryImages : (propertyData && propertyData.img ? [propertyData.img] : []);

    if (!modalMainImageEl || !modalThumbnailsContainerEl || !modalGalleryPrevBtn || !modalGalleryNextBtn) {
        console.warn("setupModalGallery: Brakuje niektórych elementów DOM galerii w modalu.");
        return;
    }

    if (images.length === 0 || !images[0]) {
        modalMainImageEl.src = 'https://placehold.co/800x600/cccccc/333333?text=Brak+zdjęć';
        modalMainImageEl.alt = 'Brak dostępnych zdjęć';
        modalThumbnailsContainerEl.innerHTML = '<p class="text-xs text-gray-500">Brak dodatkowych zdjęć.</p>';
        modalGalleryPrevBtn.classList.add('hidden');
        modalGalleryNextBtn.classList.add('hidden');
        return;
    }
    updateModalGalleryImage(images, 0);
    modalThumbnailsContainerEl.innerHTML = '';
    images.forEach((src, index) => {
        const thumb = document.createElement('img');
        thumb.src = src; thumb.alt = `Miniaturka ${index + 1}`;
        thumb.onerror = function() { this.src='https://placehold.co/100x75/cccccc/333333?text=Brak'; };
        thumb.className = 'h-16 w-20 object-cover rounded-md cursor-pointer border-2 border-transparent hover:opacity-100 transition-all duration-200 shadow-sm';
        if (index === 0) { thumb.classList.add('border-primary', 'dark:border-accent', 'ring-2', 'ring-primary', 'dark:ring-accent'); } else { thumb.classList.add('opacity-60'); }
        thumb.addEventListener('click', () => updateModalGalleryImage(images, index));
        modalThumbnailsContainerEl.appendChild(thumb);
    });
    (images.length > 1) ? (modalGalleryPrevBtn.classList.remove('hidden'), modalGalleryNextBtn.classList.remove('hidden')) : (modalGalleryPrevBtn.classList.add('hidden'), modalGalleryNextBtn.classList.add('hidden'));
}

async function handleEnhanceDescription() {
    if (!currentPropertyDataForGemini || !enhanceDescriptionBtn) return;
    enhanceDescriptionBtn.disabled = true;
    if(enhancedDescriptionOutput) enhancedDescriptionOutput.classList.remove('hidden');
    if(enhancedDescriptionLoader) enhancedDescriptionLoader.classList.remove('hidden');
    if(enhancedDescriptionText) enhancedDescriptionText.innerHTML = '';
    const prompt = `Jesteś copywriterem specjalizującym się w nieruchomościach. Ulepsz ten krótki opis nieruchomości o nazwie "${currentPropertyDataForGemini.title}" zlokalizowanej w "${currentPropertyDataForGemini.location}": "${currentPropertyDataForGemini.desc}". Stwórz bardziej pociągający, żywy i szczegółowy opis marketingowy. Podkreśl kluczowe zalety i potencjalne korzyści dla mieszkańców. Opis powinien być w języku polskim i zachęcać do zainteresowania się ofertą. Nie dodawaj żadnych wstępów typu "Oto ulepszony opis:", tylko sam opis.`;
    const result = await callGeminiSinglePromptAPI(prompt); // Zakładamy, że callGeminiSinglePromptAPI jest zdefiniowane w api.js
    if(enhancedDescriptionText) enhancedDescriptionText.innerHTML = result.replace(/\n/g, '<br>');
    if(enhancedDescriptionLoader) enhancedDescriptionLoader.classList.add('hidden');
    enhanceDescriptionBtn.disabled = false;
}
async function handleNeighborhoodInsights() {
    if (!currentPropertyDataForGemini || !neighborhoodInsightsBtn) return;
    neighborhoodInsightsBtn.disabled = true;
    if(neighborhoodInsightsOutput) neighborhoodInsightsOutput.classList.remove('hidden');
    if(neighborhoodInsightsLoader) neighborhoodInsightsLoader.classList.remove('hidden');
    if(neighborhoodInsightsText) neighborhoodInsightsText.innerHTML = '';
    const prompt = `Opisz okolicę "${currentPropertyDataForGemini.location}" pod kątem atrakcyjności dla potencjalnych mieszkańców nieruchomości "${currentPropertyDataForGemini.title}". Wymień kluczowe udogodnienia. Odpowiedź w języku polskim. Nie dodawaj żadnych wstępów, tylko sam opis.`;
    const result = await callGeminiSinglePromptAPI(prompt);
    if(neighborhoodInsightsText) neighborhoodInsightsText.innerHTML = result.replace(/\n/g, '<br>');
    if(neighborhoodInsightsLoader) neighborhoodInsightsLoader.classList.add('hidden');
    neighborhoodInsightsBtn.disabled = false;
}
async function handleInteriorDesignIdeas() {
    if (!currentPropertyDataForGemini || !interiorDesignBtn) return;
    interiorDesignBtn.disabled = true;
    if(interiorDesignOutput) interiorDesignOutput.classList.remove('hidden');
    if(interiorDesignLoader) interiorDesignLoader.classList.remove('hidden');
    if(interiorDesignText) interiorDesignText.innerHTML = '';
    const propertyType = currentPropertyDataForGemini.type || "nieruchomość";
    const propertyArea = currentPropertyDataForGemini.area_sqm ? `${currentPropertyDataForGemini.area_sqm} m²` : "o nieokreślonym metrażu";
    const prompt = `Jesteś projektantem wnętrz. Zaproponuj kilka kreatywnych pomysłów na aranżację wnętrza dla ${propertyType} o powierzchni około ${propertyArea}. Skup się na funkcjonalności i estetyce. Podaj 3-4 sugestie. Odpowiedź w języku polskim, bez wstępów.`;
    const result = await callGeminiSinglePromptAPI(prompt);
    if(interiorDesignText) interiorDesignText.innerHTML = result.replace(/\n/g, '<br>');
    if(interiorDesignLoader) interiorDesignLoader.classList.add('hidden');
    interiorDesignBtn.disabled = false;
}
async function handleInvestmentPotentialAnalysis() {
    if (!currentPropertyDataForGemini || !investmentAnalysisBtn) return;
    investmentAnalysisBtn.disabled = true;
    if(investmentAnalysisOutput) investmentAnalysisOutput.classList.remove('hidden');
    if(investmentAnalysisLoader) investmentAnalysisLoader.classList.remove('hidden');
    if(investmentAnalysisText) investmentAnalysisText.innerHTML = '';
    const propertyType = currentPropertyDataForGemini.type || "nieruchomość";
    const location = currentPropertyDataForGemini.location || "nieznana lokalizacja";
    const price = currentPropertyDataForGemini.price ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(currentPropertyDataForGemini.price) : "nieznana cena";
    const prompt = `Jesteś analitykiem rynku nieruchomości. Przeprowadź krótką, ogólną analizę potencjału inwestycyjnego dla ${propertyType} w lokalizacji ${location}, cena: ${price}. Wymień 2-3 kluczowe czynniki. Odpowiedź w języku polskim, zwięzła, jako informacja ogólna, nie porada. Zakończ informacją o konsultacji z doradcą. Bez wstępów.`;
    const result = await callGeminiSinglePromptAPI(prompt);
    if(investmentAnalysisText) investmentAnalysisText.innerHTML = result.replace(/\n/g, '<br>');
    if(investmentAnalysisLoader) investmentAnalysisLoader.classList.add('hidden');
    investmentAnalysisBtn.disabled = false;
}

function showModal(propertyIndex) {
    console.log("showModal wywołane dla indeksu:", propertyIndex);
    if (!propertyModalEl) { console.error("propertyModalEl nie istnieje. Nie można pokazać modala."); return; }
    
    const data = getPropertyByIndex(propertyIndex);
    if (!data) { console.error(`Nie znaleziono danych dla nieruchomości o indeksie: ${propertyIndex}`); return; }

    currentPropertyDataForGemini = data;
    
    // Upewnij się, że elementy wewnętrzne są pobrane (mogły być null, jeśli modal nie był w DOM przy pierwszym ładowaniu skryptu)
    // Robimy to tutaj, bo showModal jest wywoływane, gdy na pewno chcemy użyć modala.
    // Jeśli initializeModalLogic już je pobrało, to nic się nie stanie.
    if (!closeModalBtn) closeModalBtn = propertyModalEl.querySelector('#closeModal');
    if (!modalContentBox) modalContentBox = propertyModalEl.querySelector('.scale-in');
    if (!modalMainImageEl) modalMainImageEl = propertyModalEl.querySelector('#modalMainImage');
    if (!modalThumbnailsContainerEl) modalThumbnailsContainerEl = propertyModalEl.querySelector('#modalThumbnails');
    // ... i tak dalej dla wszystkich elementów wewnętrznych, jeśli jest ryzyko, że nie zostały zainicjowane

    setupModalGallery(data);

    const modalTitleEl = propertyModalEl.querySelector('#modalTitle');
    const modalLocationEl = propertyModalEl.querySelector('#modalLocation');
    const modalDescOriginalEl = propertyModalEl.querySelector('#modalDescOriginal');
    const modalDetailsEl = propertyModalEl.querySelector('#modalDetails');
    const modalPriceEl = propertyModalEl.querySelector('#modalPrice');

    if (modalTitleEl) modalTitleEl.textContent = data.title;
    if (modalLocationEl) modalLocationEl.textContent = data.location;
    if (modalDescOriginalEl) modalDescOriginalEl.textContent = data.desc;
    if (modalDetailsEl && data.det) modalDetailsEl.innerHTML = data.det.map(t => `<li class="flex items-center"><i class="fa fa-check-circle text-accent mr-2"></i>${t}</li>`).join('');
    if (modalPriceEl) modalPriceEl.textContent = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.price);

    // Resetuj stany przycisków Gemini i ich outputów
    [enhancedDescriptionOutput, neighborhoodInsightsOutput, interiorDesignOutput, investmentAnalysisOutput].forEach(el => el?.classList.add('hidden'));
    [enhancedDescriptionLoader, neighborhoodInsightsLoader, interiorDesignLoader, investmentAnalysisLoader].forEach(el => el?.classList.add('hidden'));
    [enhancedDescriptionText, neighborhoodInsightsText, interiorDesignText, investmentAnalysisText].forEach(el => { if(el) el.innerHTML = ''; });
    [enhanceDescriptionBtn, neighborhoodInsightsBtn, interiorDesignBtn, investmentAnalysisBtn].forEach(btn => { if(btn) btn.disabled = false; });

    propertyModalEl.classList.remove('inactive');
    propertyModalEl.classList.add('active');
    if (modalContentBox) modalContentBox.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    if (!propertyModalEl) return;
    if (modalContentBox) modalContentBox.classList.remove('visible'); // Najpierw animacja
    setTimeout(() => { // Daj czas na animację scale-out
        propertyModalEl.classList.add('inactive');
        propertyModalEl.classList.remove('active');
    }, 300); // Dopasuj do czasu trwania animacji .scale-in
    document.body.style.overflow = '';
    currentPropertyDataForGemini = null;
    currentModalGalleryIndex = 0;
}

function initializeModalLogic() {
    console.log("initializeModalLogic: Inicjalizuję logikę modala (modal.js)");

    if (!propertyModalEl) {
        console.warn("initializeModalLogic: Element #propertyModal nie istnieje na tej stronie. Pomijam inicjalizację modala ofert.");
        return;
    }

    // Pobierz elementy wewnętrzne modala raz, tutaj.
    closeModalBtn = propertyModalEl.querySelector('#closeModal');
    modalContentBox = propertyModalEl.querySelector('.scale-in');
    modalMainImageEl = propertyModalEl.querySelector('#modalMainImage');
    modalThumbnailsContainerEl = propertyModalEl.querySelector('#modalThumbnails');
    modalGalleryPrevBtn = propertyModalEl.querySelector('#modalGalleryPrev');
    modalGalleryNextBtn = propertyModalEl.querySelector('#modalGalleryNext');
    enhanceDescriptionBtn = propertyModalEl.querySelector('#enhanceDescriptionBtn');
    enhancedDescriptionOutput = propertyModalEl.querySelector('#enhancedDescriptionOutput');
    enhancedDescriptionLoader = propertyModalEl.querySelector('#enhancedDescriptionLoader');
    enhancedDescriptionText = propertyModalEl.querySelector('#enhancedDescriptionText');
    neighborhoodInsightsBtn = propertyModalEl.querySelector('#neighborhoodInsightsBtn');
    neighborhoodInsightsOutput = propertyModalEl.querySelector('#neighborhoodInsightsOutput');
    neighborhoodInsightsLoader = propertyModalEl.querySelector('#neighborhoodInsightsLoader');
    neighborhoodInsightsText = propertyModalEl.querySelector('#neighborhoodInsightsText');
    interiorDesignBtn = propertyModalEl.querySelector('#interiorDesignBtn');
    interiorDesignOutput = propertyModalEl.querySelector('#interiorDesignOutput');
    interiorDesignLoader = propertyModalEl.querySelector('#interiorDesignLoader');
    interiorDesignText = propertyModalEl.querySelector('#interiorDesignText');
    investmentAnalysisBtn = propertyModalEl.querySelector('#investmentAnalysisBtn');
    investmentAnalysisOutput = propertyModalEl.querySelector('#investmentAnalysisOutput');
    investmentAnalysisLoader = propertyModalEl.querySelector('#investmentAnalysisLoader');
    investmentAnalysisText = propertyModalEl.querySelector('#investmentAnalysisText');

    if (!staticModalListenersAttached) { // Dodaj listenery do statycznych części modala tylko raz
        console.log("initializeModalLogic: Dodaję listenery do statycznych elementów #propertyModal.");
        if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
        propertyModalEl.addEventListener('click', (e) => { if (e.target === propertyModalEl) { hideModal(); } });
        document.addEventListener('keydown', (e) => { 
            if (e.key === "Escape" && propertyModalEl && propertyModalEl.classList.contains('active')) { 
                hideModal(); 
            }
        });

        if (enhanceDescriptionBtn) enhanceDescriptionBtn.addEventListener('click', handleEnhanceDescription);
        if (neighborhoodInsightsBtn) neighborhoodInsightsBtn.addEventListener('click', handleNeighborhoodInsights);
        if (interiorDesignBtn) interiorDesignBtn.addEventListener('click', handleInteriorDesignIdeas);
        if (investmentAnalysisBtn) investmentAnalysisBtn.addEventListener('click', handleInvestmentPotentialAnalysis);
        
        if (modalGalleryPrevBtn) { modalGalleryPrevBtn.addEventListener('click', () => { if (currentPropertyDataForGemini && currentPropertyDataForGemini.galleryImages && currentPropertyDataForGemini.galleryImages.length > 1) { const images = currentPropertyDataForGemini.galleryImages; let newIndex = currentModalGalleryIndex - 1; if (newIndex < 0) newIndex = images.length - 1; updateModalGalleryImage(images, newIndex); } });}
        if (modalGalleryNextBtn) { modalGalleryNextBtn.addEventListener('click', () => { if (currentPropertyDataForGemini && currentPropertyDataForGemini.galleryImages && currentPropertyDataForGemini.galleryImages.length > 1) { const images = currentPropertyDataForGemini.galleryImages; let newIndex = currentModalGalleryIndex + 1; if (newIndex >= images.length) newIndex = 0; updateModalGalleryImage(images, newIndex); } });}
        
        staticModalListenersAttached = true;
    }

    // Inicjalizacja listenerów dla (potencjalnie dynamicznych) kart ofert
    const allPropertyCards = document.querySelectorAll('.property-card');
    console.log(`initializeModalLogic: Znaleziono ${allPropertyCards.length} kart ofert do podpięcia/sprawdzenia listenerów.`);
    
    allPropertyCards.forEach(card => {
        // Usuwamy stary listener, jeśli istnieje, i dodajemy nowy.
        // To jest ważne, jeśli `initializeModalLogic` jest wywoływana wielokrotnie dla tych samych kart.
        // Prostszym sposobem jest użycie flagi, ale wymaga to ostrożności.
        // Dla dynamicznie tworzonych kart, które są niszczone i tworzone na nowo,
        // nie ma potrzeby usuwania starych listenerów z nieistniejących już elementów.
        // Flaga `data-modal-listener-added` zapobiega wielokrotnemu dodawaniu do tej samej instancji karty.
        
        if (!card.hasAttribute('data-modal-listener-added')) {
            const propertyIndex = parseInt(card.dataset.propertyIndex, 10);
            if (isNaN(propertyIndex)) {
                console.warn("Karta nieruchomości nie ma poprawnego atrybutu data-property-index:", card);
                return;
            }
            const detailsButton = card.querySelector('.property-details-btn');

            const cardClickHandler = (eventOrigin) => { // Dodano argument do logowania
                console.log(`Handler karty wywołany dla indeksu: ${propertyIndex} przez ${eventOrigin}`);
                showModal(propertyIndex);
            };
            
            if (detailsButton) {
                 // Aby uniknąć podwójnego listenera, jeśli przycisk jest wewnątrz karty
                const buttonSpecificHandler = (e) => {
                    e.stopPropagation(); // Zapobiegaj wywołaniu listenera karty
                    console.log(`Przycisk 'Szczegóły' kliknięty dla indeksu: ${propertyIndex}`);
                    showModal(propertyIndex);
                };
                // Usuń stary listener, jeśli istnieje, przed dodaniem nowego
                detailsButton.removeEventListener('click', detailsButton._clickHandler); // Załóżmy, że przechowujemy referencję
                detailsButton.addEventListener('click', buttonSpecificHandler);
                detailsButton._clickHandler = buttonSpecificHandler; // Zapisz referencję do usunięcia
            }
            
            // Usuń stary listener karty, jeśli istnieje
            card.removeEventListener('click', card._clickHandler);
            card.addEventListener('click', () => cardClickHandler('card')); // Przekaż info, że to kliknięcie karty
            card._clickHandler = () => cardClickHandler('card'); // Zapisz referencję

            card.setAttribute('data-modal-listener-added', 'true'); // Ustaw flagę po dodaniu
            console.log(`Dodano listener do karty dla indeksu ${propertyIndex}`);
        } else {
            // console.log(`Listener dla karty z indeksem ${card.dataset.propertyIndex} już istnieje.`);
        }
    });
}

const localPropertyDataFallback = [ /* ... (bez zmian) ... */ ];
