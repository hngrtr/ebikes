import os
from pymongo import MongoClient
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel, Image
from google.cloud import storage

# --- Configuration ---
# You can change these values to match your environment
MONGO_CONNECTION_STRING = "mongodb://hungarter:Jp00FSA0GmkvVLPIRPKol93shn4tuzSoaxjilHnmmG4J53Hd<!-- Import failed: e882ade7-99e4-4e7b-b139-314b4a357ed8.nam5.firestore.goog:443/bikes-poc?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false" - Only .md files are supported -->
GCS_BUCKET_NAME = "ebike-images"
GCP_PROJECT_ID = "bikes-poc"
LOCATION = "us-central1" # Specify a location that supports Imagen

# Make sure you are authenticated with Google Cloud CLI and have the correct project set:
# gcloud auth application-default login
# gcloud config set project {GCP_PROJECT_ID}

def generate_and_upload_images():
    """
    Connects to the database, reads the bike data, generates images,
    uploads them to GCS, and updates the database with the public URLs.
    """

    # --- 1. Connect to the database and get the bike data ---
    print("Connecting to the database...")
    client = MongoClient(MONGO_CONNECTION_STRING)
    db = client['bikes-poc']
    ebikes_collection = db.ebikes
    bikes = list(ebikes_collection.find({}))
    print(f"Found {len(bikes)} bikes in the collection.")

    # --- Initialize Vertex AI and GCS clients ---
    vertexai.init(project=GCP_PROJECT_ID, location=LOCATION)
    storage_client = storage.Client(project=GCP_PROJECT_ID)
    bucket = storage_client.bucket(GCS_BUCKET_NAME)

    # --- 2. Process each bike ---
    for bike in bikes:
        try:
            bike_id = str(bike['_id'])
            bike_model = bike.get('model', 'Unknown Model')
            bike_description = bike.get('description', 'No description available.')
            print(f"\nProcessing bike: {bike_model} (ID: {bike_id})")

            # --- 3. Generate an image with Imagen ---
            print("Generating image with Imagen...")
            prompt = f"A professional, high-quality photograph of the {bike_model} e-bike. {bike_description}"
            
            model = ImageGenerationModel.from_pretrained("imagegeneration@006")
            
            images = model.generate_images(
                prompt=prompt,
                number_of_images=1,
                aspect_ratio="1:1"
            )
            
            # Save the image to a temporary file
            temp_image_path = f"/tmp/{bike_id}.png"
            images[0].save(location=temp_image_path, include_generation_parameters=True)
            print(f"Image generated and saved to {temp_image_path}")

            # --- 4. Upload the image to GCS ---
            print("Uploading image to GCS...")
            gcs_blob_name = f"images/{bike_id}.png"
            blob = bucket.blob(gcs_blob_name)
            blob.upload_from_filename(temp_image_path)
            print(f"Image uploaded to gs://{GCS_BUCKET_NAME}/{gcs_blob_name}")

            # --- 5. Update the database with the public URL ---
            public_url = blob.public_url
            print(f"Updating database with public URL: {public_url}")
            ebikes_collection.update_one(
                {'_id': bike['_id']},
                {'$set': {'imageUrl': public_url}}
            )
            print("Database updated successfully.")

            # Clean up the temporary file
            os.remove(temp_image_path)

        except Exception as e:
            print(f"An error occurred while processing bike {bike.get('model', 'Unknown')}: {e}")

    print("\nAll bikes have been processed.")
    client.close()

if __name__ == "__main__":
    generate_and_upload_images()
