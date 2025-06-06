// assets/js/chatbot.js

// Elementy DOM dla Chatbota
const chatbotToggleButton = document.getElementById('chatbotToggleButton');
const chatbotContainer = document.getElementById('chatbotContainer');
const closeChatbotButton = document.getElementById('closeChatbotButton');
const chatbotMessagesEl = document.getElementById('chatbotMessages');
const chatbotInputEl = document.getElementById('chatbotInput');
const chatbotSendButton = document.getElementById('chatbotSendButton');

let chatHistoryForAPI = []; // Przechowuje historię konwersacji dla API: [{role: 'user'/'model', parts: [{text: '...'}]}]

// Instrukcja systemowa dla chatbota, definiująca jego rolę i zachowanie.
const SYSTEM_INSTRUCTION_FOR_CHATBOT = "Jesteś Wirtualnym Doradcą ds. Nieruchomości dla firmy 'MW Partner'. Twoim zadaniem jest odpowiadanie na pytania użytkowników dotyczące procesu zakupu lub sprzedaży nieruchomości, dostępnych ofert (informuj, że nie masz dostępu do aktualnej bazy danych ofert w czasie rzeczywistym, ale możesz mówić ogólnie o typach ofert, cechach nieruchomości i procesie poszukiwania), rynku nieruchomości oraz udzielanie ogólnych porad. Bądź pomocny, profesjonalny i uprzejmy. Odpowiadaj zwięźle i rzeczowo, używając języka polskiego. Jeśli pytanie wykracza poza Twoje kompetencje (np. prośba o konkretną ofertę z bazy danych, której nie posiadasz, lub porada prawna), poinformuj o tym użytkownika i zasugeruj kontakt z agentem MW Partner pod numerem +48 123 456 789 lub mailowo kontakt@nwnieruchomosci.pl. Nie wymyślaj ofert ani konkretnych danych liczbowych, jeśli ich nie znasz.";

/**
 * Toggles the visibility of the chatbot container.
 * Displays a welcome message on first open.
 */
function toggleChatbot() {
    if (!chatbotContainer || !chatbotMessagesEl) {
        console.error("Elementy DOM chatbota nie zostały znalezione.");
        return;
    }
    const isActive = chatbotContainer.dataset.active === 'true';
    chatbotContainer.dataset.active = String(!isActive); // Ustawiamy jako string 'true'/'false'

    // Jeśli chatbot jest otwierany po raz pierwszy (lub po wyczyszczeniu) i nie ma wiadomości, pokaż powitalną.
    if (!isActive && chatbotMessagesEl.children.length === 0) {
        addMessageToChatUI("Witaj w NW Nieruchomości! Jestem Twoim wirtualnym doradcą. Jak mogę Ci dzisiaj pomóc?", 'bot');
        // Nie dodajemy wiadomości powitalnej do historii API, jest tylko dla UI.
        // Historia API zacznie się od instrukcji systemowej + pierwszej wiadomości użytkownika.
    }
}

/**
 * Adds a message to the chatbot's UI.
 * @param {string} text The message text.
 * @param {string} sender 'user' or 'bot'.
 */
function addMessageToChatUI(text, sender) {
    if (!chatbotMessagesEl) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chatbot-message', sender);
    // Bezpieczne renderowanie HTML - jeśli tekst pochodzi od użytkownika lub API,
    // lepiej go oczyścić lub użyć textContent, jeśli nie oczekujemy HTML.
    // Dla odpowiedzi bota, które mogą zawierać formatowanie markdown (np. listy),
    // zamiana \n na <br> jest prostym podejściem.
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    chatbotMessagesEl.appendChild(messageDiv);
    chatbotMessagesEl.scrollTop = chatbotMessagesEl.scrollHeight; // Automatyczne przewijanie na dół
}

let botLoadingMessageDiv = null; // Referencja do elementu wskaźnika ładowania bota

/**
 * Shows a "bot is typing..." indicator in the chat UI.
 */
function showBotLoadingIndicator() {
    if (!chatbotMessagesEl || botLoadingMessageDiv) return; // Już widoczny lub brak kontenera

    botLoadingMessageDiv = document.createElement('div');
    botLoadingMessageDiv.classList.add('chatbot-message', 'loading-bot'); // Użyj dedykowanej klasy
    botLoadingMessageDiv.textContent = 'Doradca pisze...';
    chatbotMessagesEl.appendChild(botLoadingMessageDiv);
    chatbotMessagesEl.scrollTop = chatbotMessagesEl.scrollHeight;
}

/**
 * Hides the "bot is typing..." indicator.
 */
function hideBotLoadingIndicator() {
    if (botLoadingMessageDiv && chatbotMessagesEl) {
        try {
            chatbotMessagesEl.removeChild(botLoadingMessageDiv);
        } catch (e) {
            // Możliwe, że element został już usunięty, ignorujemy błąd
        }
        botLoadingMessageDiv = null;
    }
}

/**
 * Handles sending a user's message to the chatbot and getting a response.
 */
async function handleSendMessageToChatbot() {
    if (!chatbotInputEl || !chatbotSendButton) return;

    const userInputText = chatbotInputEl.value.trim();
    if (!userInputText) return;

    addMessageToChatUI(userInputText, 'user');
    chatbotInputEl.value = ''; // Wyczyść pole input
    chatbotInputEl.disabled = true;
    chatbotSendButton.disabled = true;
    showBotLoadingIndicator();

    // Dodaj wiadomość użytkownika do historii API
    chatHistoryForAPI.push({ role: 'user', parts: [{ text: userInputText }] });

    // Przygotuj zawartość dla API Gemini
    // Instrukcja systemowa jest dołączana do *pierwszej* wiadomości użytkownika w historii wysyłanej do API.
    // Dla kolejnych tur, kontekst jest budowany z pełnej historii, ale instrukcja jest "wirtualnie" na początku.
    let currentTurnContents = [];
    if (chatHistoryForAPI.length === 1 && chatHistoryForAPI[0].role === 'user') {
        // Pierwsza wiadomość użytkownika w całej sesji
        currentTurnContents.push({
            role: 'user',
            parts: [{ text: SYSTEM_INSTRUCTION_FOR_CHATBOT + "\n\nOTO PIERWSZE PYTANIE UŻYTKOWNIKA:\n" + chatHistoryForAPI[0].parts[0].text }]
        });
        // Dodajemy poprzednie wiadomości modelu, jeśli istnieją (choć przy pierwszej wiadomości użytkownika nie powinno ich być)
        // To jest bardziej na przyszłość, jeśli zmienimy logikę dodawania wiadomości powitalnej bota do historii
        const modelMessages = chatHistoryForAPI.filter(msg => msg.role === 'model');
        if(modelMessages.length > 0) {
            currentTurnContents = [...modelMessages, ...currentTurnContents];
        }

    } else {
        // Dla kolejnych wiadomości, wysyłamy całą dotychczasową historię,
        // ale upewniamy się, że Gemini dostaje instrukcję systemową jako część pierwszego "user turn" w tej historii.
        const historyToSend = chatHistoryForAPI.map((turn, index) => {
            if (index === 0 && turn.role === 'user') { // Zakładamy, że pierwsza wiadomość w historii to zawsze użytkownik
                return {
                    role: 'user',
                    parts: [{ text: SYSTEM_INSTRUCTION_FOR_CHATBOT + "\n\nKONTEKST KONWERSACJI (PIERWSZE PYTANIE UŻYTKOWNIKA BYŁO):\n" + turn.parts[0].text }]
                };
            }
            return turn;
        });
        currentTurnContents = historyToSend;
    }

    const botResponseText = await callGeminiChatTurnAPI(currentTurnContents); // Wywołanie funkcji z api.js

    hideBotLoadingIndicator();
    addMessageToChatUI(botResponseText, 'bot');
    // Dodaj odpowiedź bota do historii API
    chatHistoryForAPI.push({ role: 'model', parts: [{ text: botResponseText }] });

    chatbotInputEl.disabled = false;
    chatbotSendButton.disabled = false;
    chatbotInputEl.focus();
}

/**
 * Initializes the chatbot event listeners.
 * This function should be called after the DOM is fully loaded.
 */
function initializeChatbotLogic() {
    if (chatbotToggleButton) {
        chatbotToggleButton.addEventListener('click', toggleChatbot);
    } else {
        console.warn("Przycisk przełączania chatbota nie został znaleziony.");
    }

    if (closeChatbotButton) {
        closeChatbotButton.addEventListener('click', toggleChatbot);
    } else {
        console.warn("Przycisk zamykania chatbota nie został znaleziony.");
    }

    if (chatbotSendButton) {
        chatbotSendButton.addEventListener('click', handleSendMessageToChatbot);
    } else {
        console.warn("Przycisk wysyłania wiadomości chatbota nie został znaleziony.");
    }

    if (chatbotInputEl) {
        chatbotInputEl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSendMessageToChatbot();
            }
        });
    } else {
        console.warn("Pole wprowadzania tekstu chatbota nie zostało znalezione.");
    }
}
