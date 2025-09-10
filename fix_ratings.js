const { MongoClient } = require('mongodb');

const MONGO_CONNECTION_STRING = "mongodb://hungarter:Jp00FSA0GmkvVLPIRPKol93shn4tuzSoaxjilHnmmG4J53Hd@e882ade7-99e4-4e7b-b139-314b4a357ed8.nam5.firestore.goog:443/bikes-poc?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false";

async function findInvalidRatings() {
    const client = new MongoClient(MONGO_CONNECTION_STRING);
    try {
        await client.connect();
        console.log('Connected to the database');
        const db = client.db('bikes-poc');
        const ebikes_collection = db.collection('ebikes');
        const ratings_collection = db.collection('ratings');

        const validBikeIds = (await ebikes_collection.find({}, { projection: { _id: 1 } }).toArray()).map(bike => bike._id);
        const ratings = await ratings_collection.find({}, { projection: { ebikeId: 1 } }).toArray();

        const invalidRatings = [];
        for (const rating of ratings) {
            if (!validBikeIds.includes(rating.ebikeId)) {
                invalidRatings.push(rating);
            }
        }

        console.log('Invalid ratings:', invalidRatings);
        console.log(`Found ${invalidRatings.length} invalid ratings.`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

findInvalidRatings();