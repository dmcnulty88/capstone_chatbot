import json
from llamaapi import LlamaAPI

# Initialize the llamaapi with your api_token
API_TOKEN = 'LL-DsSPVEJNNeRj21t04MdEmj59R3rdnAgGBET4MZq0sRODXkAT3XV5xJSQjK35ctFi'
llama = LlamaAPI(API_TOKEN)

user_message = input("Enter message: ")

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

# Print the extracted information
print(bot_response)