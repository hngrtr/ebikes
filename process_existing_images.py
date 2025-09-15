import os
from google.cloud import storage
from PIL import Image
import io

# --- Configuration ---
SOURCE_BUCKET_NAME = "ebike-images-us-central1" # Your new bucket name
GCP_PROJECT_ID = "bikes-poc" # Your project ID

# Define target sizes (width in pixels)
SIZES = {
    "thumbnail": 56,
    "medium": 200,
    "large": 800
}

def process_existing_images():
    print(f"Connecting to Google Cloud Storage bucket: {SOURCE_BUCKET_NAME}")
    storage_client = storage.Client(project=GCP_PROJECT_ID)
    bucket = storage_client.bucket(SOURCE_BUCKET_NAME)

    # List all blobs (files) in the bucket
    blobs = bucket.list_blobs(prefix="images/") # Assuming original images are in an 'images/' folder
    
    for blob in blobs:
        # Skip if it's not an image or if it's already a resized version
        if not blob.name.startswith("images/") or \
           "_thumbnail." in blob.name or \
           "_medium." in blob.name or \
           "_large." in blob.name:
            print(f"Skipping {blob.name} (not an original image or already processed).")
            continue

        print(f"\nProcessing original image: {blob.name}")
        
        try:
            # Download the original image data
            image_data = blob.download_as_bytes()
            original_image = Image.open(io.BytesIO(image_data))
            
            # Get original filename without path and extension
            original_filename_base = os.path.splitext(os.path.basename(blob.name))[0]
            original_extension = os.path.splitext(blob.name)[1]

            for size_name, size_pixels in SIZES.items():
                new_blob_name = f"images/{original_filename_base}_{size_name}{original_extension}"
                
                print(f"  Resizing to {size_pixels}px ({size_name})...")
                
                # Resize using Pillow
                # Ensure image is in RGB mode if it's RGBA (e.g., PNGs with alpha) for JPEG conversion
                if original_image.mode == 'RGBA':
                    original_image = original_image.convert('RGB')

                resized_image = original_image.copy()
                resized_image.thumbnail((size_pixels, size_pixels), Image.Resampling.LANCZOS)
                
                # Save resized image to a BytesIO object
                output_buffer = io.BytesIO()
                resized_image.save(output_buffer, format=original_image.format) # Use original format
                output_buffer.seek(0) # Rewind to the beginning

                # Upload the resized image
                new_blob = bucket.blob(new_blob_name)
                new_blob.upload_from_file(output_buffer, content_type=blob.content_type)
                new_blob.make_public() # Make it publicly accessible
                print(f"  Uploaded resized image: {new_blob.public_url}")

        except Exception as e:
            print(f"Error processing {blob.name}: {e}")

    print("\nFinished processing all existing images.")

if __name__ == "__main__":
    # Ensure you are authenticated: gcloud auth application-default login
    process_existing_images()
