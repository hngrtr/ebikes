from pymongo import MongoClient
import certifi

# --- Configuration ---
MONGO_CONNECTION_STRING = "mongodb://hungarter:Jp00FSA0GmkvVLPIRPKol93shn4tuzSoaxjilHnmmG4J53Hd@e882ade7-99e4-4e7b-b139-314b4a357ed8.nam5.firestore.goog:443/bikes-poc?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false"
OLD_BUCKET_NAME = "ebike-images"
NEW_BUCKET_NAME = "ebike-images-us-central1"

def update_image_urls_in_db():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_CONNECTION_STRING, tlsCAFile=certifi.where())
    db = client['bikes-poc']
    ebikes_collection = db.ebikes

    updated_count = 0
    
    # Find documents where imageUrl contains the old bucket name
    # Using a regex to find the old bucket name in the URL
    query = {"imageUrl": {"$regex": f"storage.googleapis.com/{OLD_BUCKET_NAME}"}}
    
    # Iterate and update
    for bike in ebikes_collection.find(query):
        old_url = bike["imageUrl"]
        new_url = old_url.replace(OLD_BUCKET_NAME, NEW_BUCKET_NAME)
        
        print(f"Updating _id: {bike['_id']}")
        print(f"  Old URL: {old_url}")
        print(f"  New URL: {new_url}")
        
        ebikes_collection.update_one(
            {"_id": bike['_id']},
            {"$set": {"imageUrl": new_url}}
        )
        updated_count += 1
    
    print(f"\nFinished updating. Total {updated_count} image URLs updated in the database.")
    client.close()

if __name__ == "__main__":
    update_image_urls_in_db()