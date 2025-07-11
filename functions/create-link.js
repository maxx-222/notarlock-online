// functions/create-link.js (VERSIUNEA FINALĂ)
const { MongoClient } = require('mongodb');
const { nanoid } = require('nanoid'); // Această linie rămâne la fel, dar va funcționa acum

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { clientName, encryptedPayload } = JSON.parse(event.body);
        const uniqueId = nanoid(12);

        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const collection = client.db('notarlock').collection('documents');

        await collection.insertOne({
            uniqueId,
            clientName,
            encryptedPayload,
            createdAt: new Date(),
            downloadedAt: null,
        });

        await client.close();
        const link = `/d/${uniqueId}`;
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, link, uniqueId }),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};