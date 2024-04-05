# Use the official Python image as base
FROM python:3.9

# Set the working directory in the container
WORKDIR /code

# Copy the requirements file and install dependencies
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the entire project into the container
COPY . .

# Command to run the Flask app using Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]
