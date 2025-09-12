import os
from pymongo import MongoClient
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel, Image
from google.cloud import storage
import certifi

# --- Configuration ---
# You can change these values to match your environment
MONGO_CONNECTION_STRING = "mongodb://hungarter:Jp00FSA0GmkvVLPIRPKol93shn4tuzSoaxjilHnmmG4J53Hd@e882ade7-99e4-4e7b-b139-314b4a357ed8.nam5.firestore.goog:443/bikes-poc?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false"
GCS_BUCKET_NAME = "avatar-cartoon-images"
GCP_PROJECT_ID = "bikes-poc"
LOCATION = "us-central1" # Specify a location that supports Imagen
DEFAULT_AVATAR_URL = "https://storage.googleapis.com/avatar-cartoon-images/default-avatar.png" # Placeholder for a default avatar

# Make sure you are authenticated with Google Cloud CLI and have the correct project set:
# gcloud auth application-default login
# gcloud config set project {GCP_PROJECT_ID}

def generate_and_upload_avatars():
    """
    Connects to the database, gets all unique userIds from the comments,
    generates a cartoon avatar for each user, and uploads it to GCS.
    """
    print("Connecting to the database...")
    client = MongoClient(MONGO_CONNECTION_STRING, tlsCAFile=certifi.where())
    db = client['bikes-poc']
    comments_collection = db.comments
    # Find unique userIds that have comments without an avatarUrl
    user_ids = comments_collection.distinct("userId", {"avatarUrl": {"$exists": False}})
    if not user_ids:
        user_ids = comments_collection.distinct("userId", {"avatarUrl": ""})
    print(f"Found {len(user_ids)} unique userIds without avatars.")

    vertexai.init(project=GCP_PROJECT_ID, location=LOCATION)
    storage_client = storage.Client(project=GCP_PROJECT_ID)
    bucket = storage_client.bucket(GCS_BUCKET_NAME)

    for user_id in user_ids:
        try:
            print(f"\nProcessing user: {user_id}")

            personalized_prompt = f"Create a cute 3D-style cartoon avatar head for my ebike review app for {user_id}. Make it unique and personalized."
            generic_prompt = "Create a cute 3D-style cartoon avatar head for my ebike review app. Make it unique and personalized."

            images = []
            public_url = DEFAULT_AVATAR_URL # Initialize with default, will be overwritten if generation succeeds

            # --- Attempt Personalized Image Generation ---
            try:
                print("Attempting personalized image generation...")
                model = ImageGenerationModel.from_pretrained("imagegeneration@006")
                images = model.generate_images(
                    prompt=personalized_prompt,
                    number_of_images=1,
                    aspect_ratio="1:1"
                )
                if images:
                    print("Personalized image generated successfully.")
                else:
                    print("Personalized image generation returned no images.")
            except Exception as e:
                print(f"Personalized image generation failed: {e}")
                if "sensitive words" in str(e):
                    print("Reason: Sensitive words detected.")
            
            # --- Attempt Generic Image Generation (if personalized failed) ---
            if not images:
                try:
                    print("Attempting generic image generation...")
                    images = model.generate_images(
                        prompt=generic_prompt,
                        number_of_images=1,
                        aspect_ratio="1:1"
                    )
                    if images:
                        print("Generic image generated successfully.")
                    else:
                        print("Generic image generation returned no images.")
                except Exception as e:
                    print(f"Generic image generation failed: {e}")

            # --- Process Generated Image or Use Default ---
            if images:
                try:
                    temp_image_path = f"/tmp/{user_id}.png"
                    images[0].save(location=temp_image_path, include_generation_parameters=True)
                    print(f"Image generated and saved to {temp_image_path}")

                    print("Uploading image to GCS...")
                    gcs_blob_name = f"{user_id}.png"
                    blob = bucket.blob(gcs_blob_name)
                    blob.upload_from_filename(temp_image_path)
                    print(f"Image uploaded to gs://{GCS_BUCKET_NAME}/{gcs_blob_name}")

                    public_url = blob.public_url
                    print(f"Successfully obtained public URL: {public_url}")
                except Exception as e:
                    print(f"Error during image save/upload for user {user_id}: {e}. Default avatar will be used.")
                    public_url = DEFAULT_AVATAR_URL # Fallback to default if save/upload fails
            else:
                print(f"No images generated for user {user_id} after all attempts. Using default avatar: {public_url}")

            # --- Update Comments Collection ---
            print(f"Updating comments for user {user_id} with public URL: {public_url}")
            comments_collection.update_many(
                {'userId': user_id},
                {'$set': {'avatarUrl': public_url}}
            )
            print("Comments updated successfully.")

        except Exception as e:
            print(f"An unhandled error occurred while processing user {user_id}: {e}")

    print("\nAll users have been processed.")
    client.close()

if __name__ == "__main__":
    generate_and_upload_avatars()
