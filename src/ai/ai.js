import express from "express";



//javascript
// =====================================
// OPENROUTER KONFIGURATION
// =====================================

const API_URL = "https://openrouter.ai/api/v1/responses";

const API_KEY = "";
const MODEL = "openai/gpt-4o-mini";


// =====================================
// HTML ELEMENTE
// =====================================

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

const connectionStatus = document.getElementById("connectionStatus");


// =====================================
// GESPRÄCHSVERLAUF
// =====================================

let conversation = [];


// =====================================
// NACHRICHT ANZEIGEN
// =====================================

function addMessage(text, type) {

    const message = document.createElement("div");
    message.className = `message ${type}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    avatar.textContent = type === "user" ? "👤" : "🤖";

    const content = document.createElement("div");
    content.className = "content";

    // Sicherer Text ohne ungeprüftes HTML
    content.textContent = text;

    message.appendChild(avatar);
    message.appendChild(content);

    chatMessages.appendChild(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}


// =====================================
// OPENROUTER API AUFRUF
// =====================================

async function askAI(messages) {

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            model: MODEL,

            messages: [
                {
                    role: "system",
                    content: "Du bist ein freundlicher und hilfreicher KI-Assistent. Antworte auf Deutsch."
                },
                ...messages
            ],

            temperature: 0.7,
            max_tokens: 2048

        })

    });

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error?.message ||
            `OpenRouter Fehler: ${response.status}`
        );

    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
        throw new Error("Die KI hat keine Antwort zurückgegeben.");
    }

    return answer;
}


// =====================================
// CHAT NACHRICHT SENDEN
// =====================================

chatForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const message = chatInput.value.trim();

    if (!message || sendBtn.disabled) {
        return;
    }

    if (API_KEY === "sk-or-v1-DEIN_API_KEY") {
        addMessage("Bitte trage zuerst deinen echten OpenRouter API-Key in script.js ein.", "bot");
        return;
    }

    // Begrüßung entfernen
    const welcome = chatMessages.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }

    // Benutzernachricht anzeigen
    addMessage(message, "user");

    // Verlauf speichern
    conversation.push({
        role: "user",
        content: message
    });

    // Eingabe leeren
    chatInput.value = "";
    chatInput.style.height = "auto";

    // Senden deaktivieren
    sendBtn.disabled = true;

    // Ladeanzeige erstellen
    const loadingMessage = addMessage("⏳ KI denkt ...", "bot");

    if (connectionStatus) {
        connectionStatus.textContent = "● KI antwortet ...";
    }

    try {

        // Anfrage an OpenRouter
        const answer = await askAI(conversation);

        // KI-Antwort speichern
        conversation.push({
            role: "assistant",
            content: answer
        });

        // Ladeanzeige entfernen
        loadingMessage.remove();

        // KI-Antwort anzeigen
        addMessage(answer, "bot");

        if (connectionStatus) {
            connectionStatus.textContent = "● OpenRouter verbunden";
            connectionStatus.style.color = "#4ade80";
        }

    } catch (error) {

        console.error("OpenRouter Fehler:", error);

        loadingMessage.remove();

        // Fehler im Chat anzeigen
        addMessage(
            "Fehler: " + error.message,
            "bot"
        );

        // Fehlgeschlagene Nachricht aus dem Verlauf entfernen
        conversation.pop();

        if (connectionStatus) {
            connectionStatus.textContent = "● Verbindungsfehler";
            connectionStatus.style.color = "#ff5555";
        }

    } finally {

        sendBtn.disabled = false;
        chatInput.focus();

    }

});


// =====================================
// CHAT LÖSCHEN
// =====================================

function clearChat() {

    conversation = [];

    chatMessages.innerHTML = `
        <div class="welcome">
            <div class="welcome-icon">🤖</div>
            <h1>Wie kann ich dir helfen?</h1>
            <p>Stelle mir eine Frage und ich helfe dir weiter.</p>
        </div>
    `;

}

if (clearBtn) {
    clearBtn.addEventListener("click", clearChat);
}

if (newChatBtn) {
    newChatBtn.addEventListener("click", clearChat);
}


// =====================================
// TEXTFELD AUTOMATISCH VERGRÖSSERN
// =====================================

chatInput.addEventListener("input", () => {

    chatInput.style.height = "auto";

    chatInput.style.height =
        Math.min(chatInput.scrollHeight, 180) + "px";

});


// =====================================
// ENTER ZUM SENDEN
// =====================================

chatInput.addEventListener("keydown", (event) => {

    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {

        event.preventDefault();

        chatForm.requestSubmit();

    }

});


// =====================================
// START
// =====================================

console.log("KI-Chatbot wurde gestartet.");
console.log("OpenRouter Modell:", MODEL);

if (connectionStatus) {
    connectionStatus.textContent = "● Bereit";
}
