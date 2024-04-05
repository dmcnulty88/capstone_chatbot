let mapEnabled = false; // Flag to track if mapping is enabled
let spotifyEnabled = false; // Flag to track if spotify is enabled

function sendMessage() {
    // Get user input
    var userInput = document.getElementById("user-input").value.trim();
    hideAdditionalButtons();

    if (mapEnabled) {
        // If mapping is enabled, handle mapping functionality
        if (userInput !== "") {
            // Pass user input to Python Flask for processing
            sendMappingRequest(userInput);
        } else {
            updateAndDisplayMessage("Please enter a building in the textbox below.", false);
        }
    } else if (spotifyEnabled) {
        // If spotify is enabled, handle spotify functionality
        if (userInput !== "") {
            // Pass user input to Python Flask for processing
            sendSpotifyRequest(userInput);
        } else {
            updateAndDisplayMessage("Please enter a song title or artist.", false);
        }
    } else {
        sendRegularMessage(userInput)
    }
    // Clear input field
    document.getElementById("user-input").value = "";
}


function sendSpotifyRequest(musicRequest) {
    // Display user's message immediately
    displayMessage(musicRequest, true);
    // Display loading message for bot response
    displayMessage("...", false);

    // Send the building name to the server for mapping
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/handle_spotify", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () {
        if (xhr.status === 200) {
            var responseData = JSON.parse(xhr.responseText);
            // Update chat area with bot's response
            updateBotResponse(responseData.message, false);
        }
    };
    xhr.send(JSON.stringify({ music: musicRequest }));
}

function sendMappingRequest(buildingName) {
    // Display user's message immediately
    displayMessage(buildingName, true);
    // Display loading message for bot response
    displayMessage("...", false);

    // Send the building name to the server for mapping
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/handle_mapping", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () {
        if (xhr.status === 200) {
            var responseData = JSON.parse(xhr.responseText);
            // Update chat area with bot's response
            updateBotResponse(responseData.message, false);
        }
    };
    xhr.send(JSON.stringify({ building: buildingName }));
}

function handleMapping() {
    var buildingName = document.getElementById("user-input").value.trim();
    if (buildingName !== "") {
        // Send the building name to the server for mapping
        sendMappingRequest(buildingName);

        // Clear input field
        document.getElementById("user-input").value = "";
    } else {
        // Display an error message if the input is empty
        displayMessage("Please enter a building name.", false);
    }
}

function sendRegularMessage(userInput) {
    var languageSelect = document.getElementById("language-select");
    var selectedLanguage = languageSelect.value;

    if (userInput.trim() !== "") {
        // Display user's message immediately
        displayMessage(userInput, true);

        // Display loading message for bot response
        displayMessage("...", false);

        // Send user's message and selected language to server
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/process_message", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onload = function () {
            if (xhr.status === 200) {
                var responseData = JSON.parse(xhr.responseText);
                // Update bot's response
                updateBotResponse(responseData.response);
            }
        };
        xhr.send(JSON.stringify({ message: userInput, language: selectedLanguage }));
        document.getElementById("user-input").value = "";
    }
}

function updateBotResponse(botMessage) {
    // Find the loading message and replace it with the bot's response
    var loadingMessage = document.querySelector(".loading-message");
    if (loadingMessage) {
        loadingMessage.textContent = botMessage;
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
    messageElement.textContent = message;
    messageElement.className = "message" + (isUserMessage ? " user-message" : " loading-message");
    chatList.appendChild(messageElement);
}

function updateAndDisplayMessage(message, isUserMessage){
    displayMessage(message, isUserMessage);
    updateBotResponse(message);
}

function startNewChat() {
    mapEnabled = false;
    spotifyEnabled = false;
    showAdditionalButtons();
    updateButtons(spotifyEnabled,mapEnabled);
    // Clear chat history on the client side
    var chatList = document.querySelector(".chat");
    chatList.innerHTML = '';
    updateAndDisplayMessage("Hello, how can I assist you?", false);

    // Send a POST request to clear the conversation history on the server side
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/clear_history", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log("Conversation history cleared.");
        }
    };
    xhr.send();
}

function handleKeyDown(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevents the default Enter key behavior (like adding a new line)
        sendMessage(); // Calls the sendMessage function when Enter is pressed
    }
}

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

function toggleMap() {
    hideAdditionalButtons();
    mapEnabled = !mapEnabled; // Toggle the flag
    spotifyEnabled = false;
    updateButtons(spotifyEnabled,mapEnabled)
    // Display message in the chat area based on the state
    if (mapEnabled) {
        updateAndDisplayMessage("Please enter the starting location.", false);
    } else {
        updateAndDisplayMessage("Mapping turned off.", false);
    }
}

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

const instruct1 = "Start Conversation: Type your message in the text box and press 'Send' to start a conversation with the chatbot."
const instruct2 = "Voice Input: Click 'Record Speech' to speak instead of typing. The chatbot will transcribe and respond to your voice message."
const instruct3 = "Language Selection: Use the dropdown menu to select your preferred language for communication with the chatbot."
const instruct4 = "New Chat: Click 'New Chat' to start a new conversation and clear the chat history."
const instruct5 = "Spotify: Click the spotify button to toggle functionality"
const instruct6 = "Map: Click the map button to toggle mapping functionality"

function addInstructions() {
    startNewChat();
    updateAndDisplayMessage(instruct1,false);
    updateAndDisplayMessage(instruct2,false);
    updateAndDisplayMessage(instruct3,false);
    updateAndDisplayMessage(instruct4,false);
    updateAndDisplayMessage(instruct5,false);
    updateAndDisplayMessage(instruct6,false);
    hideAdditionalButtons();
}

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

function handleSample(button){
    const question = button.innerText.trim(); // Get the inner text of the button
    hideAdditionalButtons();
    sendRegularMessage(question);
}
