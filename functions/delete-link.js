// functions/delete-link.js
const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const { id } = JSON.parse(event.body);
        if (!id) throw new Error("ID-ul este necesar pentru ștergere.");

        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const collection = client.db('notarlock').collection('documents');
        
        const result = await collection.deleteOne({ uniqueId: id });

        await client.close();

        if (result.deletedCount === 0) {
             throw new Error("Documentul nu a fost găsit pentru a fi șters.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Link șters cu succes.' }),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};