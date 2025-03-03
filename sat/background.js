let serverUrl = "http://127.0.0.1:5000"; // Default URL, can be changed in options
let currentPrompt = ""; // Store the currently selected prompt

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "analyzeSentiment",
        title: "Analyze Sentiment",
        contexts: ["selection"]
    });

    // Load available prompts
    loadPrompts();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "analyzeSentiment" && info.selectionText) {
        // Open popup with the selected text
        chrome.storage.local.set({
            selectedText: info.selectionText,
            analyzing: true
        }, () => {
            chrome.action.openPopup();
        });
    }
});

// Load prompts from the server
async function loadPrompts() {
    try {
        const response = await fetch(`${serverUrl}/prompts`);
        if (response.ok) {
            const prompts = await response.json();
            chrome.storage.local.set({ prompts: prompts });

            // Set default prompt if not already set
            chrome.storage.local.get("currentPrompt", (data) => {
                if (!data.currentPrompt && prompts.length > 0) {
                    chrome.storage.local.set({ currentPrompt: prompts[0] });
                }
            });
        }
    } catch (error) {
        console.error("Error loading prompts:", error);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getServerUrl") {
        sendResponse({ url: serverUrl });
    } else if (message.action === "setServerUrl") {
        serverUrl = message.url;
        loadPrompts(); // Reload prompts with new URL
        sendResponse({ success: true });
    } else if (message.action === "loadPrompts") {
        loadPrompts();
        sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async responses
});
