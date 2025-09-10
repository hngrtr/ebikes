const { MongoClient } = require('mongodb');

const MONGO_CONNECTION_STRING = "mongodb://hungarter:Jp00FSA0GmkvVLPIRPKol93shn4tuzSoaxjilHnmmG4J53Hd@e882ade7-99e4-4e7b-b139-314b4a357ed8.nam5.firestore.goog:443/bikes-poc?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false";

async function testAggregation() {
    const client = new MongoClient(MONGO_CONNECTION_STRING);
    try {
        await client.connect();
        console.log('Connected to the database');
        const db = client.db('bikes-poc');
        const ebikes_collection = db.collection('ebikes');

        const bikes = await ebikes_collection.aggregate([
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "bikeId",
                    as: "bikeRatings"
                }
            }
        ]).toArray();

        console.log(JSON.stringify(bikes, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

testAggregation();