import tkinter as tk
from tkinter import Scrollbar
import random  # For generating random responses
import openai
import json
from llamaapi import LlamaAPI

# Initialize the llamaapi with your api_token
API_TOKEN = 'LL-DsSPVEJNNeRj21t04MdEmj59R3rdnAgGBET4MZq0sRODXkAT3XV5xJSQjK35ctFi'
llama = LlamaAPI(API_TOKEN)

# Function to send a message
def send_message():
    user_message = input_box.get("1.0", "end-1c")  # Get text from the input box
    chat_box.config(state=tk.NORMAL)  # Allow modification
    chat_box.insert(tk.END, f"You: {user_message}\n")  # Add user's message to the chat box
    chat_box.config(state=tk.DISABLED)  # Disable further modification
    input_box.delete("1.0", tk.END)  # Clear the input box
    
    # Define your API request
    api_request_json = {
        "messages": [
            {"role": "user", "content": user_message},
        ]
    }

    # Make your request and handle the response
    response = llama.run(api_request_json)
    response_json = response.json()

    # Extract relevant information
    bot_response = response_json["choices"][0]["message"]["content"]

    # Update the chat display with the chatbot's response
    chat_box.config(state=tk.NORMAL)  # Allow modification
    chat_box.insert(tk.END, f"-----------------------------------------------------------------\n")
    chat_box.insert(tk.END, f"Chatbot: {bot_response}\n")  # Add chatbot's response to the chat box
    chat_box.insert(tk.END, f"-----------------------------------------------------------------\n")
    chat_box.config(state=tk.DISABLED)  # Disable further modification

# Create the main window
root = tk.Tk()
root.title("Chat Window")
root.geometry("600x600")

# Create a chat display box
chat_box = tk.Text(root, wrap=tk.WORD, state=tk.DISABLED,padx=20,pady=10)
chat_box.pack(padx=10, pady=10, fill=tk.BOTH, expand=True)

# Add a scrollbar to the chat display box
scrollbar = Scrollbar(chat_box)
scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
chat_box.config(yscrollcommand=scrollbar.set)
scrollbar.config(command=chat_box.yview)

# Create an input box
input_box = tk.Text(root, height=3)
input_box.pack(padx=10, pady=10, fill=tk.BOTH)

# Create a send button
send_button = tk.Button(root, text="Send", command=send_message)
send_button.pack()

# Start the main loop
root.mainloop()
