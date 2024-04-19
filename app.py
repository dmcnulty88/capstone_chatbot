from flask import Flask, render_template, request, jsonify
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import requests
import folium
import polyline
import base64
import os

# =================================== Initializations =================================== #
# Load environment variables from .env file
load_dotenv()

# Initialize flask
app = Flask(__name__)

# Initialize the Hugging Face model
HF_ACESS_TOKEN = os.getenv("HF_ACCESS_TOKEN")
client = InferenceClient(model="mistralai/Mixtral-8x7B-Instruct-v0.1",token=HF_ACESS_TOKEN)

# Spotify Initializations
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_API_URL = 'https://api.spotify.com/v1/'

# Replace with your actual GraphHopper API key
GRAPHHOPPER_API_KEY = 'f70a4563-ed75-45cb-965c-7d92054db22c'
GRAPHHOPPER_URL = 'https://graphhopper.com/api/1/'

# Language based system prompts
english_system_prompt = "Please answer the questions as concisely and politely as possible. You are virtually located at Fairfield University Campus, in Fairfield, CT."
english_system_prompt = "You are a helpful assistant, virtually located at Fairfield University Campus, in Fairfield, CT."
spanish_system_prompt = "Eres un útil asistente de IA. Por favor responda las preguntas de manera concisa y cortés. Está ubicado en el campus de la Universidad de Fairfield, en Fairfield, CT."
italian_system_prompt = "Sei un utile assistente AI. Si prega di rispondere alle domande in modo conciso e cortese. Ti trovi nel campus della Fairfield University, a Fairfield, CT."
french_system_prompt = "Vous êtes un assistant IA utile. Veuillez répondre aux questions de manière concise et polie. Vous êtes situé sur le campus de l'Université Fairfield, à Fairfield, CT."
german_system_prompt = "Sie sind ein hilfreicher KI-Assistent. Bitte beantworten Sie die Fragen prägnant und höflich. Sie befinden sich auf dem Fairfield University Campus in Fairfield, CT."

# Initialize conversation history
conversation_history = []

# =================================== Global Functions =================================== #
def geocode_location(api_key, location):
    # Geocode location using GraphHopper Geocoding API
    geocoding_url = f'https://graphhopper.com/api/1/geocode?q={location}&key={api_key}'
    response = requests.get(geocoding_url)

    if response.status_code == 200:
        data = response.json()
        # Extract the coordinates from the geocoding response
        coordinates = [data["hits"][0]["point"]["lat"], data["hits"][0]["point"]["lng"]]
        return coordinates
    else:
        print(f'Geocoding Error: {response.status_code}, {response.text}')
        return None

def get_mapping_access_token():
    auth_header = base64.b64encode((CLIENT_ID + ':' + CLIENT_SECRET).encode('utf-8')).decode('utf-8')
    headers = {'Authorization': 'Basic {}'.format(auth_header)}
    data = {
        'grant_type': 'client_credentials',
    }
    response = requests.post('https://accounts.spotify.com/api/token', data=data, headers=headers)
    if response.status_code == 200:
        token_info = response.json()
        access_token = token_info['access_token']
        return access_token
    else:
        return None

def format_prompt(message, history):
    prompt = "<s>"
    for user_prompt, bot_response in history:
        prompt += f"[INST] {user_prompt} [/INST]"
        prompt += f" {bot_response}</s> "
    prompt += f"[INST] {message} [/INST]"
    return prompt

def generate_output(prompt, history, system_prompt):
    formatted_prompt = format_prompt(f"{system_prompt}, {prompt}", history)
    generate_kwargs = dict(
        temperature=0.15,
        max_new_tokens=512,
        top_p=0.9,
        repetition_penalty=1.0,
        do_sample=True,
        seed=42,
    )
    output = client.text_generation(formatted_prompt, **generate_kwargs)
    return output


# =================================== Flask Routes =================================== #
@app.route('/')
def index():
    return render_template('index.html')

# Process Message Route - Normal Bot Response
@app.route('/process_message', methods=['POST'])
def process_message():
    user_input = request.json['message']
    selected_language = request.json['language']
    if selected_language == "english":
        system_prompt = english_system_prompt
    elif selected_language == "spanish":
        system_prompt = spanish_system_prompt
    elif selected_language == "french":
        system_prompt = french_system_prompt
    elif selected_language == "german":
        system_prompt = german_system_prompt
    elif selected_language == "italian":
        system_prompt = italian_system_prompt
    else:
        system_prompt = english_system_prompt

    bot_response = generate_output(user_input, conversation_history, system_prompt)
    conversation_history.append((user_input, bot_response))
    return jsonify({'response': bot_response})

# Clear Conversation History Route
@app.route('/clear_history', methods=['POST'])
def clear_history():
    global conversation_history
    conversation_history = []
    return jsonify({'success': True})

# Mapping Route
@app.route('/handle_mapping', methods=['POST'])
def handle_mapping():
    # Retrieve data from front end
    data = request.json
    start_location = data.get("start_location")
    end_location = data.get("end_location")

    # Geocode start and end locations
    start_coordinates = geocode_location(GRAPHHOPPER_API_KEY, start_location)
    end_coordinates = geocode_location(GRAPHHOPPER_API_KEY, end_location)

    if start_coordinates and end_coordinates:
        routing_url = f'{GRAPHHOPPER_URL}route?point={start_coordinates[0]},{start_coordinates[1]}&point={end_coordinates[0]},{end_coordinates[1]}&vehicle=foot&key={GRAPHHOPPER_API_KEY}'

        response = requests.get(routing_url)

        if response.status_code == 200:
            data = response.json()

            # Extract relevant information from the response
            distance_meters = data['paths'][0]['distance']
            time_milliseconds = data['paths'][0]['time']

            # Convert distance to miles (1 meter = 0.000621371 miles)
            distance_miles = distance_meters * 0.000621371

            # Convert time to hours and minutes
            total_time_seconds = time_milliseconds / 1000
            total_time_hours = int(total_time_seconds // 3600)
            total_time_minutes = int((total_time_seconds % 3600) // 60)

            # Check if the total distance is under 0.2 miles and display in feet
            if distance_miles < 0.2:
                distance = f'{distance_miles * 5280:.2f} feet'
            else:
                distance = f'{distance_miles:.2f} miles'

            # Print total time with hours and minutes only if not 0
            if total_time_hours > 0:
                total_time = f'{total_time_hours} hours and {total_time_minutes} minutes'
            else:
                total_time = f'{total_time_minutes} minutes'

            # Extract polyline data
            polyline_data = data['paths'][0]['points']

            # Decode polyline into list of coordinates
            decoded_polyline = polyline.decode(polyline_data)

            # Create a folium map
            map_obj = folium.Map(location=[start_coordinates[0], start_coordinates[1]], zoom_start=14)

            # Add markers for start and end locations with different colors
            folium.Marker(location=[start_coordinates[0], start_coordinates[1]], popup='Start', icon=folium.Icon(color='green')).add_to(map_obj)
            folium.Marker(location=[end_coordinates[0], end_coordinates[1]], popup='End', icon=folium.Icon(color='red')).add_to(map_obj)

            # Add a PolyLine to trace the route
            folium.PolyLine(decoded_polyline, color='blue', weight=5, opacity=0.7).add_to(map_obj)

            # Save the map to a temporary HTML file
            map_html = map_obj.get_root().render()

            # Initialize the message variable
            routeMessage = ''

            # Add total distance and total time to the message
            routeMessage += f'Starting Location: {start_location}\n'
            routeMessage += f'Ending Location: {end_location}\n\n'
            routeMessage += f'Total Distance: {distance}\n'
            routeMessage += f'Total Time: {total_time}\n\n'

            # Add directions to the message
            routeMessage += 'Directions:\n'
            for i, step in enumerate(data['paths'][0]['instructions'], start=1):
                distance_step_meters = step["distance"]
                distance_step_miles = distance_step_meters * 0.000621371

                # Check if the distance for the step is under 0.2 miles and display in feet
                if distance_step_miles < 0.2:
                    distance_step = f'{distance_step_miles * 5280:.2f} feet'
                else:
                    distance_step = f'{distance_step_miles:.2f} miles'
                # Append the step to the message
                routeMessage += f'{i}. {step["text"]} ({distance_step})\n'

            return jsonify({'message': routeMessage, 'map_html': map_html})
        else:
            return jsonify({'error': f'Routing Error: {response.status_code}, {response.text}'}), 500
    else:
        return jsonify({'error': 'Geocoding failed. Check your input locations.'}), 400


# Spotify Route
@app.route('/handle_spotify', methods=['POST'])
def handle_spotify():
    # Get access token
    spotify_access_token = get_mapping_access_token()

    # Extract data from front ent
    data = request.get_json()
    musicRequest = data.get('song')

    if spotify_access_token:
        headers = {
            'Authorization': 'Bearer {}'.format(spotify_access_token)
        }
        params = {
            'q': musicRequest,
            'type': 'track',
            'limit': 5
        }
        response = requests.get(SPOTIFY_API_URL + 'search', params=params, headers=headers)
        if response.status_code == 200:
            data = response.json()
            tracks = data['tracks']['items']  # Accessing the 'items' key of the 'tracks' dictionary
            formatted_tracks = []
            for track in tracks:
                formatted_track = {
                    'name': track['name'],
                    'album': track['album']['name'],
                    'artist': track['artists'][0]['name'],  # Assuming there's only one artist for simplicity
                    'image': track['album']['images'][2]['url'],  # Using the third image
                    'preview_url': track['id']
                }
                formatted_tracks.append(formatted_track)

            return jsonify(formatted_tracks)
        else:
            return jsonify({'status': 'Error', 'message': 'Unable to fetch serach results from spotify'})
    else:
            return jsonify({'status': 'Error', 'message': 'Unable to retrieve access token'})

# Play Music Route
@app.route('/play', methods=['POST'])
def play():
    track_id = request.form['track_id']
    access_token = get_mapping_access_token()

    if access_token:
        headers = {
            'Authorization': 'Bearer {}'.format(access_token)
        }
        response = requests.get(SPOTIFY_API_URL + 'tracks/{}'.format(track_id), headers=headers)
        if response.status_code == 200:
            data = response.json()
            preview_url = data.get('preview_url', "")
            return jsonify({"preview_url": preview_url})
        else:
            return "Error: Unable to fetch track preview from Spotify API"
    else:
        return "Error: Unable to retrieve access token"

if __name__ == '__main__':
    app.run(debug=True)
