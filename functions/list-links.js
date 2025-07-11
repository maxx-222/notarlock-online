// functions/list-links.js
const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const collection = client.db('notarlock').collection('documents');

        // Găsim toate documentele și le sortăm de la cel mai nou la cel mai vechi
        // Proiectăm doar câmpurile necesare pentru a nu trimite payload-ul mare
        const links = await collection.find({})
            .sort({ createdAt: -1 })
            .project({ 
                uniqueId: 1, 
                clientName: 1, 
                createdAt: 1, 
                downloadedAt: 1,
                _id: 0 // Excludem _id-ul intern al lui Mongo
            })
            .toArray();

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify(links),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};