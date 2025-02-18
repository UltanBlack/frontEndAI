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

            //Object.keys(data).forEach(key => {
            //  console.log(key, data[key]);
            //});
            const sorted = Object.entries(data).sort((a, b) => {
              return b[1] - a[1]; // Descending order
            });
            console.log(sorted);
            //responseDiv.innerHTML = `<p><strong>Sentiment:</strong> ${JSON.stringify(sorted)}</p>`;
            sorted.forEach(([sentiment, weight]) => {
                if (weight >= 0.0001) {
                const percentage = weight * 100; // Convert range 0-1 to percentage
                responseDiv.innerHTML += `
                    <div class="sentiment-container">
                        <span>${sentiment}: ${percentage.toFixed(2)}%</span>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                `;
                }
            });

        } else {
            responseDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
        }
    } catch (error) {
        responseDiv.innerHTML = `<p class="error">An error occurred: ${error.message}</p>`;
    }
}
