let mapEnabled = false; // Flag to track if mapping is enabled
let spotifyEnabled = false; // Flag to track if spotify is enabled
startNewChat();

function sendMessage() {
    // Hide sample questions buttons
    hideAdditionalButtons();

    // Determine route based on Map and Spotify flags
    if (mapEnabled) {
        // If mapping is enabled, handle mapping functionality
        handleMapping()
    } else if (spotifyEnabled) {
        // If spotify is enabled, handle spotify functionality
        var userInput = document.getElementById("user-input").value.trim();
        if (userInput !== "") {
            // Pass user input to Python Flask for processing
            sendSpotifyRequest(userInput);
        } else {
            updateAndDisplayMessage("Please enter a song title or artist.", false);
        }
    } else {
        var userInput = document.getElementById("user-input").value.trim();
        sendRegularMessage(userInput)
    }
    // Clear input field
    document.getElementById("user-input").value = "";
}


// ============================== Spotify ==============================
function toggleSpotify(){
    hideAdditionalButtons();
    spotifyEnabled = !spotifyEnabled
    mapEnabled = false;
    // Update the appearance of the buttons
    updateButtons(spotifyEnabled,mapEnabled)

    if (spotifyEnabled) {
        updateAndDisplayMessage("Please enter a song title or artist.", false);
    } else {
        updateAndDisplayMessage("Spotify turned off.", false);
    }

}
function sendSpotifyRequest(musicRequest) {
    // Display user's message immediately
    displayMessage(musicRequest, true);

    // Send user's message and selected language to server
    fetch('/handle_spotify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({ song: musicRequest })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .then(responseData => {
        // Display Spotify results
        displaySpotifyResults(responseData)
        console.log("Attempting to display Spotify results");
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
function displaySpotifyResults(results) {
    updateAndDisplayMessage("Here are the top 5 results for this query:");
    var chatList = document.querySelector(".chat");
    results.forEach(track => {
        var messageElement = document.createElement("li");
        messageElement.className = "message-music";

        // Create and append image element
        var imageElement = document.createElement("img");
        imageElement.src = track.image;
        imageElement.className = "play-btn";
        imageElement.dataset.id = track.preview_url; // Use preview URL as track ID
        imageElement.addEventListener("click", play);
        messageElement.appendChild(imageElement);

        // Create and append text content (track name and artist)
        var textElement = document.createElement("span");
        textElement.textContent = track.name + ' - ' + track.artist;
        messageElement.appendChild(textElement);

        chatList.appendChild(messageElement);
    });
}

function play() {
    const trackId = this.getAttribute('data-id');
    fetch('/play', {
        method: 'POST',
        body: new URLSearchParams({track_id: trackId}),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => response.json())
    .then(data => {
        const player = document.getElementById('player');
        player.innerHTML = '';
        if (data && data.preview_url) {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = data.preview_url;
            player.appendChild(audio);
            audio.play()
            audio.addEventListener('ended', function() {
                audio.currentTime = 0; // Reset audio to the beginning
                audio.play(); // Restart playback
            });
        } else {
            player.innerHTML = 'No preview available';
        }
    });
}


// ============================== Mapping ==============================
function toggleMap() {
    hideAdditionalButtons();
    mapEnabled = !mapEnabled; // Toggle the flag
    spotifyEnabled = false;
    updateButtons(spotifyEnabled,mapEnabled)
    // Display message in the chat area based on the state
    if (mapEnabled) {
        addLocationDropDown("start_location", false, "Select Starting Location: ");
        addLocationDropDown("end_location", false, "Select Ending Location: ");
    } else {
        updateAndDisplayMessage("Mapping turned off.", false);
    }
}
function addLocationDropDown(idAndName, isUserMessage, location_string) {
    var chatList = document.querySelector(".chat");

    // Create message element
    var messageElement = document.createElement("li");
    messageElement.className = "message";

    // Create label for the drop down menu
    var dropdownLabel = document.createElement("label");
    dropdownLabel.setAttribute("for", idAndName);
    dropdownLabel.textContent = location_string;

    // Add elements to the html
    messageElement.appendChild(dropdownLabel);
    chatList.appendChild(messageElement);

    var dropdown = document.createElement("select");
    dropdown.setAttribute("id", idAndName);
    dropdown.setAttribute("name", idAndName);
    dropdown.className = "location-dropdown";

    var locations = {
        "42 Langguth Road":"42 Langguth Road, West Langguth Road, 06824 Fairfield, Connecticut, United States",
        "Kelley Center":"Aloysius P. Kelley Center, Loyola Drive, 06824 Fairfield, United States",
        "Alumni Hall Sports Arena":"Alumni Hall Sports Arena, Leeber Road, 06824 Fairfield, Connecticut, United States",
        "Alumni House":"Alumni House, Stonkas Road, 06824 Fairfield, United States",
        "Alumni Softball Field":"Alumni Softball Field, McCormick Road, 06824 Fairfield, United States",
        "Barlow Field":"Barlow Field, Barlow Road, 06824 Fairfield, United States",
        "Barone Campus Center":"Barone Campus Center, Loyola Drive, 06824 Fairfield, United States",
        "Bellarmine Hall":"Bellarmine Hall, Fitzgerald Way, 06824 Fairfield, United States",
        "Campion Hall":"Campion Hall, McCormick Road, 06824 Fairfield, United States",
        "Canisius Hall":"Canisius Hall, East Langguth Road, 06824 Fairfield, Connecticut, United States",
        "Center for Nursing and Health Studies":"Center for Nursing and Health Studies, McInnes Road, 06824 Fairfield, United States",
        "Charles F Dolan School of Business":"Charles F Dolan School of Business, Bellarmine Road, 06824 Fairfield, CT, United States",
        "Claver Hall":"Claver Hall, Mahan Road, 06824 Fairfield, United States",
        "Conference Center at Fairfield U":"Conference Center at Fairfield University, Walters Way, 06824 Fairfield, United States",
        "David J Dolan House":"David J Dolan House, Mooney Road, 06824 Fairfield, CT, United States",
        "DiMenna-Nyselius Library":"DiMenna-Nyselius Library, McInnes Road, 06824 Fairfield, United States",
        "Donnarumma Hall":"Donnarumma Hall, East Langguth Road, 06824 Fairfield, Connecticut, United States",
        "Egan Chapel of Saint Ignatius Lo":"Egan Chapel of Saint Ignatius Loyola, Bellarmine Road, 06824 Fairfield, United States",
        "Faber Hall":"Faber Hall, Bellarmine Road, 06824 Fairfield, United States",
        "Gonzaga Hall":"Gonzaga Hall, East Langguth Road, 06824 Fairfield, Connecticut, United States",
        "Jesuit Community Center":"Jesuit Community Center, Bellarmine Road, 06824 Fairfield, United States",
        "Jogues Hall":"Jogues Hall, McCormick Road, 06824 Fairfield, United States",
        "John C. Dolan Hall":"John C. Dolan Hall, Mooney Road, 06824 Fairfield, CT, United States",
        "Kelley Center Parking Garage":"Kelley Center Parking Garage, Leeber Road, 06824 Fairfield, Connecticut, United States",
        "Kostka Hall":"Kostka Hall, Mahan Road, 06824 Fairfield, United States",
        "Lessing Field":"Lessing Field, Leeber Road, 06824 Fairfield, Connecticut, United States",
        "Loyola Hall":"Loyola Hall, McCormick Road, 06824 Fairfield, United States",
        "Mahan Road":"Mahan Road, 06824 Fairfield, United States",
        "McAuliffe Hall":"McAuliffe Hall, Ross Road, 06824 Fairfield, United States",
        "McCormick Road":"McCormick Road, 06824 Fairfield, United States",
        "Meditz Hall":"Meditz Hall, McInnes Road, 06824 Fairfield, United States",
        "Rafferty Stadium":"Rafferty Stadium, Lynch Road, 06824 Fairfield, United States",
        "Regina A Quick Center for the Arts":"Regina A Quick Center for the Arts, McInnes Road, 06824 Fairfield, CT, United States",
        "Regis Hall":"Regis Hall, East Langguth Road, 06824 Fairfield, Connecticut, United States",
        "Rudolph F. Bannow Science Center":"Rudolph F. Bannow Science Center, McInnes Road, 06824 Fairfield, United States",
        "Student Townhouse Complex":"Student Townhouse Complex, Lynch Road, 06824 Fairfield, CT, United States",
        "The Levee":"The Levee, Lynch Road, 06824 Fairfield, CT, United States",
        "University Field":"University Field, Leeber Road, 06824 Fairfield, Connecticut, United States",
        "Walsh Athletic Center":"Walsh Athletic Center, Lynch Road, 06824 Fairfield, United States"
    };

    Object.keys(locations).forEach(function(key) {
        var option = document.createElement("option");
        option.setAttribute("value", locations[key]);
        option.textContent = key;
        dropdown.appendChild(option);
    });
    messageElement.appendChild(dropdown);
}

function handleMapping() {
    var start_location = document.getElementById("start_location").value
    var end_location = document.getElementById("end_location").value
    // Create an object with the data
    var data = {
        start_location: start_location,
        end_location: end_location
    };
    fetch('/handle_mapping', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(data) // Pass the data object
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .then(responseData => {
        // Clear display, and display map rsults
        console.log("Attempting to display mapping results");
        toggleMap();
        clearChat();
        displayMessage(responseData.message, false);
        displayMap(responseData);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
function displayMap(responseData){
    // Select the chat area
    var chatList = document.querySelector(".chat");

    // Create new message element in the chat
    var messageElement = document.createElement("li");
    messageElement.className = "message";
    chatList.appendChild(messageElement);

    // Create new map element in the message element
    var mapContainer = document.createElement("iframe");
    mapContainer.srcdoc = responseData.map_html
    messageElement.appendChild(mapContainer);
}


// ============================== Chatbot ==============================
function sendRegularMessage(userInput) {
    var languageSelect = document.getElementById("language-select");
    var selectedLanguage = languageSelect.value;

    if (userInput.trim() !== "") {
        // Display user's message immediately
        displayMessage(userInput, true);

        // Display loading message for bot response
        displayMessage("...", false);

        // Send user's message and selected language to server using fetch
        fetch('/process_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: JSON.stringify({ message: userInput, language: selectedLanguage })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Network response was not ok.');
            }
        })
        .then(responseData => {
            // Update bot's response
            updateBotResponse(responseData.response);
        })
        .catch(error => {
            console.error('Error:', error);
        });

        // Clear user input field
        document.getElementById("user-input").value = "";
    }
}

// Function to check if a message contains 'code block'
function hasCodeSnippet(message) {
    return /\```(?:[^```]+)\```/g.test(message);
}

// Function to convert message to HTML with code blocks
function convertMessageToHTML(message) {
    // Check if the message contains code snippets
    if (hasCodeSnippet(message)) {
        // Replace triple backticks with <pre><code> and </code></pre>
        message = message.replace(/```(.*?)```/gs, '<div class="code-wrapper"><pre><code>$1</code></pre></div>');
        return message
    } else {
        return message
    }
}

function updateBotResponse(botMessage) {
    // Find the loading message and replace it with the bot's response
    var loadingMessage = document.querySelector(".loading-message");
    if (loadingMessage) {
        loadingMessage.innerHTML = convertMessageToHTML(botMessage.trim());
        loadingMessage.classList.remove("loading-message");
    } else {
        // If loading message is not found, add the bot's response
        displayMessage(botMessage, false);
    }
}

function displayMessage(message, isUserMessage) {
    var chatList = document.querySelector(".chat");

    // Display user's message or bot's response
    var messageElement = document.createElement("li");
    if (hasCodeSnippet(message)){
        messageElement.innerHTML = convertMessageToHTML(message);
        messageElement.className = "message" + (isUserMessage ? " user-message" : " loading-message");
        chatList.appendChild(messageElement);
    } else {
        messageElement.innerHTML = message;
        messageElement.className = "message" + (isUserMessage ? " user-message" : " loading-message");
        chatList.appendChild(messageElement);
    }
}

// Helper function to display and update message
function updateAndDisplayMessage(message, isUserMessage){
    displayMessage(message, isUserMessage);
    updateBotResponse(message);
}


// ============================== New Chat ==============================
// Function to start new chat
function startNewChat() {
    mapEnabled = false; // Reset map flag to false
    spotifyEnabled = false; // Reset spotify flag to false
    updateButtons(spotifyEnabled,mapEnabled); // Update button highlighting
    showAdditionalButtons(); // Show the sample prompts
    clearChat();
    updateAndDisplayMessage("Hello, how can I assist you?", false);

    // Send a POST request to clear the conversation history on the server side
    fetch('/clear_history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
    .then(response => {
        if (response.ok) {
            console.log('Conversation history cleared.');
        } else {
            throw new Error('Failed to clear conversation history.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
    // Clear the audio player
    const player = document.getElementById('player');
    player.innerHTML = '';
}

// Helper function to clear chat container messages
function clearChat(){
    var chatList = document.querySelector(".chat");
    chatList.innerHTML = '';
}

// ============================== Speech Recognition ==============================
function startSpeechRecognition() {
    var recognition = new window.webkitSpeechRecognition(); // Create a new SpeechRecognition object

    recognition.lang = "en-US"; // Set language to English (United States)

    recognition.onresult = function(event) { // When speech recognition is successful
        var transcript = event.results[0][0].transcript; // Get the recognized transcript
        document.getElementById("user-input").value = transcript; // Set the transcript as user input
        sendMessage(); // Call sendMessage function to process the input
    };

    recognition.onerror = function(event) { // If there's an error in speech recognition
        console.error("Speech recognition error:", event.error);
        alert("Error occurred in speech recognition. Please try again."); // Show an error message
    };

    recognition.onstart = function() { // When speech recognition starts
        document.getElementById("record-button").classList.add("active"); // Add "active" class to record button
    };

    recognition.onend = function() { // When speech recognition ends
        document.getElementById("record-button").classList.remove("active"); // Remove "active" class from record button
    };

    recognition.start(); // Start speech recognition
}

// ============================== Instructions ==============================
const instructions = `Start Conversation: Type your message in the text box and press 'Send' to start a conversation with the chatbot.\n
Voice Input: Click 'Record Speech' to speak instead of typing. The chatbot will transcribe and respond to your voice message. \n
Language Selection: Use the dropdown menu to select your preferred language for communication with the chatbot. \n
New Chat: Click 'New Chat' to start a new conversation and clear the chat history. \n
Spotify: Click the spotify button to toggle functionality \n
Map: Click the map button to toggle mapping functionality\n`
// Function to display the instructions
function addInstructions() {
    startNewChat();
    updateAndDisplayMessage(instructions,false);
    hideAdditionalButtons();
}


// ============================== Buttons ==============================
// Function to update the spotify and map buttons
function updateButtons(spotifyEnabled,mapEnabled) {
    // Update spotify button
    const spotifyButton = document.getElementById("spotify-button");
    spotifyButton.classList.toggle("active", spotifyEnabled); // Add or remove "active" class

    // Update map button
    const mapButton = document.getElementById("map-button");
    mapButton.classList.toggle("active", mapEnabled); // Add or remove "active" class
}
// Function to hide additional buttons
function hideAdditionalButtons() {
    var additionalButtons = document.getElementById("additional-buttons");
    additionalButtons.style.display = "none";
}
// Function to show additional buttons
function showAdditionalButtons() {
    var additionalButtons = document.getElementById("additional-buttons");
    additionalButtons.style.display = "block";
}
// Function to handle sample buttons
function handleSample(button){
    const question = button.innerText.trim(); // Get the inner text of the button
    hideAdditionalButtons();
    sendRegularMessage(question);
}
// Function to allow user to press enter to submit
function handleKeyDown(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevents the default Enter key behavior (like adding a new line)
        sendMessage(); // Calls the sendMessage function when Enter is pressed
    }
}
