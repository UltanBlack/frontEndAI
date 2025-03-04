const emojis =
{
    "sadness": "😢",
    "surprise": "😲",
    "joy": "😊",
    "anger": "😡",
    "disgust": "🤢",
    "fear": "😱",
    "neutral": "😐"
}
document.addEventListener("DOMContentLoaded", async () => {
    const inputText = document.getElementById('inputText');
    const promptDropdown = document.getElementById('prompt-dropdown');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const responseDiv = document.getElementById('response');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.getElementById('settingsPanel');
    const serverUrlInput = document.getElementById('serverUrl');
    const saveSettingsBtn = document.getElementById('saveSettings');

    let serverUrl = "http://127.0.0.1:5000";

    // Get server URL from background script
    chrome.runtime.sendMessage({ action: "getServerUrl" }, (response) => {
        if (response && response.url) {
            serverUrl = response.url;
            serverUrlInput.value = serverUrl;
        }
    });

    // Load prompts
    loadPrompts();

    // Check if this popup was opened from a context menu selection
    chrome.storage.local.get(["selectedText", "analyzing"], (data) => {
        if (data.selectedText) {
            inputText.value = data.selectedText;

            // If opened from context menu with analyzing flag, start analysis immediately
            if (data.analyzing) {
                chrome.storage.local.remove("analyzing"); // Clear the flag
                generateSentiment();
            }
        }
    });

    // Settings toggle
    settingsToggle.addEventListener("click", () => {
        settingsPanel.classList.toggle("hidden");
    });

    // Save settings
    saveSettingsBtn.addEventListener("click", () => {
        const newUrl = serverUrlInput.value.trim();
        if (newUrl) {
            serverUrl = newUrl;
            chrome.runtime.sendMessage({
                action: "setServerUrl",
                url: newUrl
            });
            settingsPanel.classList.add("hidden");
            loadPrompts();
        }
    });

    // Analyze button click handler
    analyzeBtn.addEventListener("click", generateSentiment);

    // Load prompts from storage or server
    async function loadPrompts() {
        // First check if we have prompts in storage
        chrome.storage.local.get(["prompts", "currentPrompt"], (data) => {
            if (data.prompts && data.prompts.length > 0) {
                populatePromptDropdown(data.prompts, data.currentPrompt);
            } else {
                // If not, request to load from server
                chrome.runtime.sendMessage({ action: "loadPrompts" });

                // Retry after a short delay to allow background script time to fetch
                setTimeout(() => {
                    chrome.storage.local.get(["prompts", "currentPrompt"], (newData) => {
                        if (newData.prompts && newData.prompts.length > 0) {
                            populatePromptDropdown(newData.prompts, newData.currentPrompt);
                        }
                    });
                }, 1000);
            }
        });
    }

    // Populate prompt dropdown
    function populatePromptDropdown(prompts, currentPrompt) {
        // Clear dropdown
        promptDropdown.innerHTML = '';

        // Add prompts
        prompts.forEach(prompt => {
            const option = document.createElement("option");
            option.value = prompt;
            option.textContent = prompt;
            promptDropdown.appendChild(option);
        });

        // Select current prompt if available
        if (currentPrompt && prompts.includes(currentPrompt)) {
            promptDropdown.value = currentPrompt;
        }

        // Save selected prompt when changed
        promptDropdown.addEventListener('change', () => {
            chrome.storage.local.set({ currentPrompt: promptDropdown.value });
        });
    }

    // Generate sentiment analysis
    async function generateSentiment() {
        const text = inputText.value;
        const selectedPrompt = promptDropdown.value;

        // Clear previous response
        responseDiv.innerHTML = '';

        if (!text) {
            responseDiv.innerHTML = '<p class="error">Please enter some text.</p>';
            return;
        }

        try {
            responseDiv.innerHTML = '<p>Analyzing...</p>';

            const response = await fetch(`${serverUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text, prompt: selectedPrompt })
            });

            const data = await response.json();

            if (response.ok) {
                // Clear analyzing message
                responseDiv.innerHTML = '';

                // Sort and display the results
                const sorted = Object.entries(data).sort((a, b) => {
                    return b[1] - a[1]; // Descending order
                });

                sorted.forEach(([sentiment, weight]) => {
                    if (weight >= 0.0001) {
                        const percentage = weight * 100; // Convert range 0-1 to percentage
                        responseDiv.innerHTML += `
              <div class="sentiment-container">
                <span>${emojis[sentiment.toLowerCase()]} ${sentiment}: ${percentage.toFixed(2)}%</span>
                <div class="progress-container">
                  <div class="progress-bar ${sentiment.toLowerCase()}" style="width: ${percentage}%;"></div>
                </div>
              </div>
            `;
                    }
                });
            } else {
                responseDiv.innerHTML = `<p class="error">Error: ${data.error || 'Server error'}</p>`;
            }
        } catch (error) {
            responseDiv.innerHTML = `<p class="error">An error occurred: ${error.message || 'Connection failed'}</p>`;
        }
    }
});
