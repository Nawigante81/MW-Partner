// assets/js/api.js

const GEMINI_API_KEY = "AIzaSyDdua7TqzWUIGDIdRxILzBcZWWw0t1-Krc"; // User's API Key

/**
 * Calls the Gemini API for single-turn prompts (e.g., enhancing descriptions, neighborhood insights).
 * @param {string} prompt The prompt to send to the Gemini API.
 * @returns {Promise<string>} The text response from Gemini or an error message.
 */
async function callGeminiSinglePromptAPI(prompt) {
    // Construct the chat history for a single user turn.
    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Błąd API Gemini (Single Prompt):", response.status, errorData);
            // It's good to provide a user-friendly error, but also log details for debugging.
            return `Wystąpił błąd podczas komunikacji z API (status: ${response.status}). Spróbuj ponownie później.`;
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            // Handle cases where the response might be blocked or malformed.
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason === "SAFETY") {
                console.warn("Odpowiedź zablokowana przez ustawienia bezpieczeństwa Gemini (Single Prompt):", result.candidates[0].safetyRatings);
                return "Przepraszam, treść odpowiedzi została zablokowana ze względów bezpieczeństwa.";
            }
            console.error("Nieoczekiwana struktura odpowiedzi Gemini (Single Prompt):", result);
            return "Otrzymano nieoczekiwaną odpowiedź od serwisu. Spróbuj ponownie.";
        }
    } catch (error) {
        console.error("Błąd sieci lub inny błąd podczas wywoływania Gemini API (Single Prompt):", error);
        return `Wystąpił błąd sieci lub problem z połączeniem: ${error.message}. Sprawdź połączenie internetowe.`;
    }
}

/**
 * Calls the Gemini API for multi-turn chat conversations.
 * @param {Array<Object>} chatContents The history of the conversation.
 * Each object should have `role` ('user' or 'model') and `parts` (array of {text: 'message'}).
 * @returns {Promise<string>} The text response from Gemini for the current turn or an error message.
 */
async function callGeminiChatTurnAPI(chatContents) {
    const payload = { contents: chatContents };
    // Using gemini-2.0-flash as it's generally good for chat and might be what the key is provisioned for by default in Canvas.
    // If you have a key for a different model (e.g., gemini-pro), you might need to adjust the model name.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Błąd API Gemini (Chat):", response.status, errorData);
            return `Wystąpił błąd podczas komunikacji z API czatu (status: ${response.status}). Spróbuj ponownie później.`;
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason === "SAFETY") {
                console.warn("Odpowiedź zablokowana przez ustawienia bezpieczeństwa Gemini (Chat):", result.candidates[0].safetyRatings);
                return "Przepraszam, nie mogę odpowiedzieć na to zapytanie z powodu ustawień bezpieczeństwa.";
            }
            console.error("Nieoczekiwana struktura odpowiedzi Gemini (Chat):", result);
            return "Otrzymano nieoczekiwaną odpowiedź od serwisu czatu. Spróbuj ponownie.";
        }
    } catch (error) {
        console.error("Błąd sieci lub inny błąd podczas wywoływania Gemini API (Chat):", error);
        return `Wystąpił błąd sieci lub problem z połączeniem podczas rozmowy: ${error.message}. Sprawdź połączenie internetowe.`;
    }
}
