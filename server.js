const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 8080;
const MONGO_CONNECTION_STRING = "mongodb://hungarter:Jp00FSA0GmkvVLPIRPKol93shn4tuzSoaxjilHnmmG4J53Hd@e882ade7-99e4-4e7b-b139-314b4a357ed8.nam5.firestore.goog:443/bikes-poc?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false";

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public'), {
    maxAge: '1y', // Cache for 1 year
    immutable: true, // Indicate that the files will not change
}));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});



// API endpoint to get all bikes
app.get('/api/bikes', async (req, res) => {
    const client = new MongoClient(MONGO_CONNECTION_STRING);
    try {
        await client.connect();
        const db = client.db('bikes-poc');
        const ebikes_collection = db.collection('ebikes');
        const ratings_collection = db.collection('ratings');

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit to 10
        const skip = (page - 1) * limit;

        // 1. Get paginated bikes
        const bikes = await ebikes_collection.find({})
                                            .skip(skip)
                                            .limit(limit)
                                            .toArray();

        // Get total count for pagination metadata
        const totalBikes = await ebikes_collection.countDocuments({});

        // Extract bike IDs for ratings lookup
        const bikeIds = bikes.map(bike => bike._id.toString());

        // 2. Get ratings stats only for the paginated bikes
        const allRatingsStats = await ratings_collection.aggregate([
            {
                $match: {
                    ebikeId: { $in: bikeIds } // Match only ratings for current page's bikes
                }
            },
            {
                $group: {
                    _id: "$ebikeId",
                    averageRating: { $avg: "$rating" },
                    ratingCount: { $sum: 1 }
                }
            }
        ]).toArray();

        // Create a map for easy lookup
        const ratingsMap = allRatingsStats.reduce((acc, rating) => {
            acc[rating._id] = rating;
            return acc;
        }, {});

        // 3. Combine results
        const results = bikes.map(bike => {
            const bikeIdStr = bike._id.toString();
            const ratingStats = ratingsMap[bikeIdStr];
            return {
                ...bike,
                averageRating: ratingStats ? ratingStats.averageRating : 0,
                ratingCount: ratingStats ? ratingStats.ratingCount : 0
            };
        });

        // Send paginated results along with total count
        res.json({
            bikes: results,
            totalBikes: totalBikes,
            currentPage: page,
            totalPages: Math.ceil(totalBikes / limit)
        });

    } catch (err) {
        console.error('Error fetching bikes:', err);
        res.status(500).json({ error: 'Error fetching bikes', details: err.message });
    } finally {
        await client.close();
    }
});

// API endpoint to get a single bike
app.get('/api/bikes/:id', async (req, res) => {
    const client = new MongoClient(MONGO_CONNECTION_STRING);
    try {
        await client.connect();
        const db = client.db('bikes-poc');
        const ebikes_collection = db.collection('ebikes');
        const ratings_collection = db.collection('ratings');
        const comments_collection = db.collection('comments');
        const { id } = req.params;

        // 1. Get bike details
        const bike = await ebikes_collection.findOne({ _id: id });

        if (!bike) {
            return res.status(404).json({ error: 'Bike not found' });
        }

        // 2. Get ratings
        const ratingStats = await ratings_collection.aggregate([
            {
                $match: { "ebikeId": id }
            },
            {
                $group: {
                    _id: "$ebikeId",
                    averageRating: { $avg: "$rating" },
                    ratingCount: { $sum: 1 }
                }
            }
        ]).toArray();

        // 3. Get comments
        const comments = await comments_collection.find({ ebikeId: id }).toArray();

        // 4. Combine results
        const result = { ...bike };
        if (ratingStats.length > 0) {
            result.averageRating = ratingStats[0].averageRating;
            result.ratingCount = ratingStats[0].ratingCount;
        } else {
            result.averageRating = 0;
            result.ratingCount = 0;
        }
        result.comments = comments;

        res.json(result);

    } catch (err) {
        console.error('Error fetching bike:', err);
        res.status(500).json({ error: 'Error fetching bike', details: err.message });
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});