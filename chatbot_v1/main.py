import tkinter as tk
from tkinter import Scrollbar, StringVar, OptionMenu
import random # For generating random responses
import openai
import json
from llamaapi import LlamaAPI
import speech_recognition as sr
import pyaudio

# Initialize llamaapi with api_token
API_TOKEN = 'LL-DsSPVEJNNeRj21t04MdEmj59R3rdnAgGBET4MZq0sRODXkAT3XV5xJSQjK35ctFi'
llama = LlamaAPI(API_TOKEN)

# Initialize mic & recognizer
recognizer = sr.Recognizer()
mic = sr.Microphone()

def record_speech():
    recording_label.config(text="Recording...")
    root.update() # Updates tkinter interface to show user recording is in progress

    with mic as source:
        recognizer.adjust_for_ambient_noise(source)
        audio_data = recognizer.listen(source, timeout=5) # length of time for speech recognition
    
    try:
        user_message = recognizer.recognize_google(audio_data)
        input_box.insert(tk.END, user_message + "\n")
    except sr.UnknownValueError:
        print("Speech Recognition unable to understand prompt. Please try again.")
    except sr.RequestError as e:
        print(f"Error connecting to speech recognition API. Wifi Problem?:{e}")

    recording_label.config(text="") #Removes the recording label after complted speech recognition
    root.update() # Updates tkinter window to show label change

def send_message():
    user_message = input_box.get("1.0", "end-1c")
    chat_box.config(state=tk.NORMAL)
    chat_box.insert(tk.END, f"You: {user_message}\n")
    chat_box.config(state=tk.DISABLED)
    input_box.delete("1.0", tk.END)
    
    api_request_json = {
        "messages": [
            {"role": "user", "content": user_message},
        ]
    }

    response = llama.run(api_request_json)
    response_json = response.json()
    bot_response = response_json["choices"][0]["message"]["content"]

    chat_box.config(state=tk.NORMAL)
    chat_box.insert(tk.END, f"-----------------------------------------------------------------\n")
    chat_box.insert(tk.END, f"Chatbot: {bot_response}\n")
    chat_box.insert(tk.END, f"-----------------------------------------------------------------\n")
    chat_box.config(state=tk.DISABLED)

# Creating the main window
root = tk.Tk()
root.title("Chatbot v1")
root.geometry("600x600")

# Creating chat display box
chat_box = tk.Text(root, wrap=tk.WORD, state=tk.DISABLED, padx=20, pady=10)
chat_box.pack(padx=10, pady=10, fill=tk.BOTH, expand=True)

# Add scrollbar to chat box
scrollbar = Scrollbar(chat_box)
scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
chat_box.config(yscrollcommand=scrollbar.set)
scrollbar.config(command=chat_box.yview)

# Create input box
input_box = tk.Text(root, height=3)
input_box.pack(padx=10, pady=10, fill=tk.BOTH)

# Create a "Record Speech" button
record_button = tk.Button(root, text="Record Speech", command=record_speech)
record_button.pack()

# create a drop-down menu for language selection
languages = ["en", "es"] # add more languages as needed
selected_languages = StringVar(root)
selected_languages.set(languages[0]) # set the default language 
language_menu = OptionMenu(root, selected_languages, *languages)
language_menu.pack()

# Create a send button
send_button = tk.Button(root, text="Send", command=send_message)
send_button.pack()

# Create a label to display "Recording..."
recording_label = tk.Label(root, text="")
recording_label.pack()

root.mainloop()