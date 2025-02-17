async function generateSentiment() {
    const inputText = document.getElementById('inputText').value;
    const responseDiv = document.getElementById('response');
    
    // Clear previous response
    responseDiv.innerHTML = '';

    if (!inputText) {
        responseDiv.innerHTML = '<p class="error">Please enter some text.</p>';
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: inputText })
        });

        const data = await response.json();

        if (response.ok) {
            // Display the generated sentiment
            responseDiv.innerHTML = `<p><strong>Sentiment:</strong> ${JSON.stringify(data)}</p>`;
        } else {
            responseDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
        }
    } catch (error) {
        responseDiv.innerHTML = `<p class="error">An error occurred: ${error.message}</p>`;
    }
}
