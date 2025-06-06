// assets/js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM załadowany, start skryptu main.js");
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(() => console.log('Service Worker zarejestrowany'))
            .catch(err => console.error('Błąd rejestracji Service Worker:', err));
    }

    let allFetchedProperties = [];
    if (typeof loadAndStoreProperties === 'function') {
        allFetchedProperties = await loadAndStoreProperties();
    } else {
        console.warn("Funkcja loadAndStoreProperties nie jest zdefiniowana.");
    }

    let allFetchedArticles = []; // Zmieniono nazwę zmiennej dla spójności
    async function loadArticles() {
        try {
            const response = await fetch('data/articles.json');
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            const data = await response.json(); // Przypisz do lokalnej zmiennej
            console.log("Dane artykułów wczytane:", data);
            return data; // Zwróć dane
        } catch (error) {
            console.error("Nie udało się wczytać danych artykułów z articles.json:", error);
            return [];
        }
    }
    allFetchedArticles = await loadArticles(); // Przypisz wczytane artykuły do allFetchedArticles

    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) { currentYearEl.textContent = new Date().getFullYear(); }

    const darkBtn = document.getElementById('toggleDark');
    if (darkBtn) {
        // Sprawdź preferencje użytkownika lub zapisane ustawienia
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        darkBtn.addEventListener('click', () => {
            const isCurrentlyDark = document.documentElement.classList.toggle('dark');
            // Zapisz preferencje
            localStorage.setItem('darkMode', isCurrentlyDark);
            // Opcjonalnie: odśwież karty ofert, aby zaktualizować kolory obramowań miniaturek w modalu
            if (typeof renderPropertyCards === 'function') renderPropertyCards();
        });
    }

    const menuBtn = document.getElementById('menuBtn'); /* ... (logika menu mobilnego bez zmian) ... */
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    const mobileNavLinks = mobileMenu ? mobileMenu.querySelectorAll('.mobile-nav-link') : [];
    if (menuBtn && mobileMenu && closeMenu) {
        menuBtn.addEventListener('click', () => { mobileMenu.style.transform = 'translateX(0)'; document.body.style.overflow = 'hidden'; });
        closeMenu.addEventListener('click', () => { mobileMenu.style.transform = 'translateX(-100%)'; document.body.style.overflow = ''; });
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => { mobileMenu.style.transform = 'translateX(-100%)'; document.body.style.overflow = ''; });
        });
    }

    const topBtn = document.getElementById('topBtn'); /* ... (bez zmian) ... */
    if (topBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                topBtn.classList.remove('opacity-0', 'invisible'); topBtn.classList.add('opacity-100', 'visible');
            } else {
                topBtn.classList.remove('opacity-100', 'visible'); topBtn.classList.add('opacity-0', 'invisible');
            }
        });
        topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }


    const elementsToReveal = document.querySelectorAll('.fade-in, .slide-right, .scale-in-scroll'); /* ... (bez zmian) ... */
    function revealOnScroll() {
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const revealOffset = 80;
        elementsToReveal.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top <= windowHeight - revealOffset && rect.bottom >= revealOffset / 2) {
                el.classList.add('visible');
            }
        });
    }
    if (elementsToReveal.length > 0) {
        window.addEventListener('scroll', revealOnScroll);
        revealOnScroll();
    }

    async function handleFormSubmit(event, formElement, statusElement) { /* ... (bez zmian) ... */ }
    const contactForm = document.getElementById('contactForm'); /* ... (reszta logiki formularzy bez zmian) ... */
    const formStatus = document.getElementById('formStatus');
    if (contactForm && formStatus) { contactForm.addEventListener('submit', (event) => handleFormSubmit(event, contactForm, formStatus)); }
    
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterStatus = document.getElementById('newsletterStatus');
    if (newsletterForm && newsletterStatus) { newsletterForm.addEventListener('submit', (event) => handleFormSubmit(event, newsletterForm, newsletterStatus)); }

    const scheduleViewingFormEl = document.getElementById('scheduleViewingForm');
    const scheduleFormStatusEl = document.getElementById('scheduleFormStatus');
    if (scheduleViewingFormEl && scheduleFormStatusEl) {
        scheduleViewingFormEl.addEventListener('submit', (event) => handleFormSubmit(event, scheduleViewingFormEl, scheduleFormStatusEl));
    }

    const slides = document.querySelectorAll('.hero-slider .slide'); /* ... (reszta logiki slidera bez zmian) ... */
    const prevSlideBtn = document.getElementById('prevSlide');
    const nextSlideBtn = document.getElementById('nextSlide');
    const sliderDotsContainer = document.getElementById('sliderDots');
    const openChatbotFromHeroBtn = document.getElementById('openChatbotFromHero');
    let currentSlideIndex = 0;
    let slideInterval;
    function showSlide(index) { if (slides.length === 0) return; slides.forEach((slide, i) => { slide.classList.remove('active'); if (i === index) { slide.classList.add('active'); } }); if (sliderDotsContainer) { const dots = sliderDotsContainer.querySelectorAll('.slider-dot'); dots.forEach((dot, i) => { dot.classList.toggle('active', i === index); }); } currentSlideIndex = index; }
    function nextSlide() { if (slides.length === 0) return; let newIndex = currentSlideIndex + 1; if (newIndex >= slides.length) { newIndex = 0; } showSlide(newIndex); }
    function prevSlide() { if (slides.length === 0) return; let newIndex = currentSlideIndex - 1; if (newIndex < 0) { newIndex = slides.length - 1; } showSlide(newIndex); }
    function createDots() { if (!sliderDotsContainer || slides.length === 0) return; sliderDotsContainer.innerHTML = ''; slides.forEach((_, i) => { const dot = document.createElement('button'); dot.classList.add('slider-dot'); dot.setAttribute('aria-label', `Idź do slajdu ${i + 1}`); dot.addEventListener('click', () => { showSlide(i); resetSlideInterval(); }); sliderDotsContainer.appendChild(dot); }); }
    function resetSlideInterval() { if (slides.length === 0) return; clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 7000); }
    if (slides.length > 0) { createDots(); showSlide(0); resetSlideInterval(); if (prevSlideBtn) { prevSlideBtn.addEventListener('click', () => { prevSlide(); resetSlideInterval(); }); } if (nextSlideBtn) { nextSlideBtn.addEventListener('click', () => { nextSlide(); resetSlideInterval(); }); } }
    if (openChatbotFromHeroBtn && typeof toggleChatbot === 'function') { openChatbotFromHeroBtn.addEventListener('click', () => { const chatbotContainerEl = document.getElementById('chatbotContainer'); if (chatbotContainerEl && typeof toggleChatbot === 'function') { if (chatbotContainerEl.dataset.active !== 'true') { toggleChatbot(); } } else if (typeof toggleChatbot === 'function') { toggleChatbot(); } }); }

    function formatPrice(price) {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
    }

    // --- Logika Paginacji dla Ofert ---
    let currentOffersPage = 1; // Zmieniono nazwę z currentPage
    const offersPerPage = 6; 
    let currentFilteredAndSortedProperties = []; 

    function renderPropertyCards() {
        const container = document.getElementById('offers-grid-container');
        const loadingIndicator = document.getElementById('offers-loading-indicator');
        if (!container) { return; }
        if (loadingIndicator) { loadingIndicator.style.display = 'none'; }
        container.innerHTML = '';

        if (!currentFilteredAndSortedProperties || currentFilteredAndSortedProperties.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">Brak ofert spełniających wybrane kryteria.</p>';
            setupOffersPagination(); 
            return;
        }

        const startIndex = (currentOffersPage - 1) * offersPerPage;
        const endIndex = startIndex + offersPerPage;
        const paginatedItems = currentFilteredAndSortedProperties.slice(startIndex, endIndex);

        paginatedItems.forEach((prop) => {
            const originalIndex = allFetchedProperties.findIndex(p => p.title === prop.title && p.location === prop.location && p.price === prop.price);
            const badgeColorClass = prop.badge_color === 'accent' ? 'bg-accent' : 'bg-primary';
            const cardHTML = `
            <div class="property-card bg-white dark:bg-gray-800/80 dark:glass p-0 rounded-2xl shadow-xl hover:shadow-neon overflow-hidden relative group flex flex-col" data-property-index="${originalIndex !== -1 ? originalIndex : 'unknown'}">
                <div class="relative">
                  <img src="${prop.img}" onerror="this.src='https://placehold.co/600x400/cccccc/333333?text=Brak+obrazu'" class="w-full h-56 object-cover group-hover:blur-[2px] transition duration-200" alt="${prop.title}">
                  <div class="absolute top-4 left-4 ${badgeColorClass} text-white px-4 py-1 rounded-full text-xs font-bold shadow">${prop.badge || 'Polecane'}</div>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                  <h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">${prop.title}</h3>
                  <p class="text-gray-600 dark:text-gray-300 mb-2 property-location">${prop.location}</p>
                  <div class="flex flex-wrap justify-between text-sm text-gray-500 dark:text-gray-400 my-3">
                    <span class="mr-2 mb-1"><i class="fa fa-bed mr-1 text-primary dark:text-accent"></i> ${prop.rooms || (prop.det && prop.det[0]) || ''}</span>
                    <span class="mr-2 mb-1"><i class="fa fa-bath mr-1 text-primary dark:text-accent"></i> ${(prop.det && prop.det[1]) || ''}</span>
                    <span class="mr-2 mb-1"><i class="fa fa-ruler-combined mr-1 text-primary dark:text-accent"></i> ${prop.area_sqm || (prop.det && prop.det[2]) || ''} m²</span>
                    ${prop.yearBuilt ? `<span class="mr-2 mb-1"><i class="fa fa-calendar-alt mr-1 text-primary dark:text-accent"></i> ${prop.yearBuilt}</span>` : ''}
                  </div>
                  <div class="mt-auto flex justify-between items-end">
                    <span class="text-2xl font-black text-accent">${formatPrice(prop.price)}</span>
                    <button class="property-details-btn relative btn-wave bg-primary text-white px-4 py-2 rounded-lg shadow hover:scale-105 hover:bg-blue-600 dark:hover:bg-blue-500">Odkryj Szczegóły</button>
                  </div>
                </div>
            </div>`;
            container.innerHTML += cardHTML;
        });
        if (typeof initializeModalLogic === 'function') {
            initializeModalLogic();
        }
        setupOffersPagination();
    }

    function setupOffersPagination() {
        const paginationWrapper = document.getElementById('pagination-container'); // Upewnij się, że ID jest unikalne dla ofert
        if (!paginationWrapper) return;
        paginationWrapper.innerHTML = ''; 

        if (!currentFilteredAndSortedProperties || currentFilteredAndSortedProperties.length === 0) return;
        const pageCount = Math.ceil(currentFilteredAndSortedProperties.length / offersPerPage);
        if (pageCount <= 1) return;

        const prevButton = document.createElement('button'); /* ... (logika przycisku Previous bez zmian) ... */
        prevButton.innerHTML = `<i class="fas fa-chevron-left"></i> Poprzednia`;
        prevButton.className = `px-4 py-2 mx-1 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition`;
        if (currentOffersPage === 1) { prevButton.disabled = true; prevButton.classList.add('opacity-50', 'cursor-not-allowed'); }
        prevButton.addEventListener('click', () => { if (currentOffersPage > 1) { currentOffersPage--; renderPropertyCards(); window.scrollTo({ top: document.getElementById('filters-and-sorting').offsetTop - 80, behavior: 'smooth' }); } });
        paginationWrapper.appendChild(prevButton);

        for (let i = 1; i <= pageCount; i++) { /* ... (logika przycisków numerycznych bez zmian, użyj currentOffersPage) ... */ 
            const pageButton = document.createElement('button'); pageButton.textContent = i;
            pageButton.className = `px-4 py-2 mx-1 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition`;
            if (i === currentOffersPage) { pageButton.classList.add('bg-primary', 'text-white', 'dark:bg-accent', 'dark:text-gray-900', 'border-primary', 'dark:border-accent'); pageButton.disabled = true; }
            pageButton.addEventListener('click', () => { currentOffersPage = i; renderPropertyCards(); window.scrollTo({ top: document.getElementById('filters-and-sorting').offsetTop - 80, behavior: 'smooth' }); });
            paginationWrapper.appendChild(pageButton);
        }
        
        const nextButton = document.createElement('button'); /* ... (logika przycisku Next bez zmian, użyj currentOffersPage) ... */
        nextButton.innerHTML = `Następna <i class="fas fa-chevron-right"></i>`;
        nextButton.className = `px-4 py-2 mx-1 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition`;
        if (currentOffersPage === pageCount) { nextButton.disabled = true; nextButton.classList.add('opacity-50', 'cursor-not-allowed'); }
        nextButton.addEventListener('click', () => { if (currentOffersPage < pageCount) { currentOffersPage++; renderPropertyCards(); window.scrollTo({ top: document.getElementById('filters-and-sorting').offsetTop - 80, behavior: 'smooth' }); } });
        paginationWrapper.appendChild(nextButton);
    }

    function populateFilterDropdowns(sourceProperties) { /* ... (bez zmian) ... */ }
    function applyFiltersAndSorting() { /* ... (zmiana: currentOffersPage = 1; na początku) ... */
        if (!allFetchedProperties) { currentFilteredAndSortedProperties = []; renderPropertyCards(); return; }
        if (allFetchedProperties.length === 0) { currentFilteredAndSortedProperties = []; renderPropertyCards(); return; }
        let filteredProperties = [...allFetchedProperties];
        // ... (reszta logiki filtrowania bez zmian) ...
        currentFilteredAndSortedProperties = filteredProperties;
        currentOffersPage = 1; // Zresetuj do pierwszej strony!
        renderPropertyCards();
    }


    // --- Logika Paginacji dla Artykułów ---
    let currentArticlesPage = 1;
    const articlesPerPage = 6; // Wyświetlaj 6 artykułów na stronie

    function renderArticles() { // Zmieniono nazwę z displayArticles, aby była spójna
        const container = document.getElementById('articles-grid-container');
        const loadingIndicator = document.getElementById('articles-loading-indicator');
        if (!container) return;

        if (loadingIndicator) loadingIndicator.style.display = 'none';
        container.innerHTML = '';

        if (!allFetchedArticles || allFetchedArticles.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">Obecnie brak artykułów do wyświetlenia.</p>';
            setupArticlesPagination(); // Wywołaj, aby wyczyścić/zaktualizować paginację
            return;
        }

        const startIndex = (currentArticlesPage - 1) * articlesPerPage;
        const endIndex = startIndex + articlesPerPage;
        const paginatedArticles = allFetchedArticles.slice(startIndex, endIndex);

        paginatedArticles.forEach(article => {
            const cardHTML = `
            <article class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-300">
                <a href="${article.link}" class="block hover:opacity-90 transition-opacity">
                    <img src="${article.image}" onerror="this.src='${article.placeholderImage}'" alt="Miniatura artykułu: ${article.title}" class="w-full h-48 object-cover">
                </a>
                <div class="p-6 flex flex-col flex-grow">
                    <span class="text-xs font-semibold text-primary dark:text-accent uppercase tracking-wider mb-1">${article.category}</span>
                    <h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white hover:text-primary dark:hover:text-accent transition-colors">
                        <a href="${article.link}">${article.title}</a>
                    </h2>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow">${article.excerpt}</p>
                    <div class="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                         <span class="text-xs text-gray-500 dark:text-gray-500">${article.date}</span>
                        <a href="${article.link}" class="text-sm font-medium text-primary dark:text-accent hover:underline">Czytaj więcej <i class="fas fa-arrow-right ml-1 text-xs"></i></a>
                    </div>
                </div>
            </article>`;
            container.innerHTML += cardHTML;
        });
        setupArticlesPagination(); // Zaktualizuj paginację po renderowaniu artykułów
    }

    function setupArticlesPagination() {
        const paginationWrapper = document.getElementById('articles-pagination-container');
        if (!paginationWrapper) return;
        paginationWrapper.innerHTML = '';

        if (!allFetchedArticles || allFetchedArticles.length === 0) return;
        const pageCount = Math.ceil(allFetchedArticles.length / articlesPerPage);
        if (pageCount <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = `<i class="fas fa-chevron-left"></i> Poprzednia`;
        prevButton.className = `px-4 py-2 mx-1 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition`;
        if (currentArticlesPage === 1) { prevButton.disabled = true; prevButton.classList.add('opacity-50', 'cursor-not-allowed'); }
        prevButton.addEventListener('click', () => {
            if (currentArticlesPage > 1) {
                currentArticlesPage--;
                renderArticles();
                // Przewiń do góry sekcji artykułów (opcjonalnie)
                const articlesSection = document.getElementById('articles-grid-container');
                if (articlesSection) window.scrollTo({ top: articlesSection.offsetTop - 80, behavior: 'smooth' });
            }
        });
        paginationWrapper.appendChild(prevButton);

        for (let i = 1; i <= pageCount; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = `px-4 py-2 mx-1 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition`;
            if (i === currentArticlesPage) {
                pageButton.classList.add('bg-primary', 'text-white', 'dark:bg-accent', 'dark:text-gray-900', 'border-primary', 'dark:border-accent');
                pageButton.disabled = true;
            }
            pageButton.addEventListener('click', () => {
                currentArticlesPage = i;
                renderArticles();
                const articlesSection = document.getElementById('articles-grid-container');
                if (articlesSection) window.scrollTo({ top: articlesSection.offsetTop - 80, behavior: 'smooth' });
            });
            paginationWrapper.appendChild(pageButton);
        }
        
        const nextButton = document.createElement('button');
        nextButton.innerHTML = `Następna <i class="fas fa-chevron-right"></i>`;
        nextButton.className = `px-4 py-2 mx-1 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition`;
        if (currentArticlesPage === pageCount) { nextButton.disabled = true; nextButton.classList.add('opacity-50', 'cursor-not-allowed'); }
        nextButton.addEventListener('click', () => {
            if (currentArticlesPage < pageCount) {
                currentArticlesPage++;
                renderArticles();
                const articlesSection = document.getElementById('articles-grid-container');
                if (articlesSection) window.scrollTo({ top: articlesSection.offsetTop - 80, behavior: 'smooth' });
            }
        });
        paginationWrapper.appendChild(nextButton);
    }


    // --- Inicjalizacja logiki z osobnych plików i specyficzna dla strony ---
    const offersGridContainerEl = document.getElementById('offers-grid-container');
    if (offersGridContainerEl) {
        if (allFetchedProperties && allFetchedProperties.length > 0) {
            populateFilterDropdowns(allFetchedProperties);
            applyFiltersAndSorting();
        } else {
            renderPropertyCards([]);
        }
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const resetFiltersBtn = document.getElementById('reset-filters-btn');
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFiltersAndSorting);
        if (resetFiltersBtn) { /* ... (logika resetowania filtrów bez zmian) ... */ }
    }

    const articlesGridContainerEl = document.getElementById('articles-grid-container');
    if (articlesGridContainerEl) { // Jesteśmy na stronie aktualnosci.html
        console.log("Strona aktualności wykryta, inicjalizuję wyświetlanie artykułów.");
        renderArticles(); // Wyświetl pierwszą stronę artykułów i paginację
    }

    if (document.getElementById('oferta-tygodnia')) { /* ... (bez zmian) ... */ }
    if (typeof initializeChatbotLogic === 'function') { initializeChatbotLogic(); } else { console.error("Funkcja initializeChatbotLogic nie została znaleziona."); }
});
