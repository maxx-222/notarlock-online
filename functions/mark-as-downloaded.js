// functions/mark-as-downloaded.js (VERSIUNE ACTUALIZATĂ)
const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { id } = JSON.parse(event.body);
        if (!id) throw new Error("ID-ul este necesar pentru actualizare.");

        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const collection = client.db('notarlock').collection('documents');
        
        // Căutăm documentul cu ID-ul unic și setăm 'downloadedAt'
        // DOAR dacă nu a fost setat deja. Astfel, stocăm doar data primei descărcări.
        const result = await collection.updateOne(
            { uniqueId: id, downloadedAt: null }, // Condiția: actualizează doar dacă downloadedAt este încă null
            { $set: { downloadedAt: new Date() } } // Setează câmpul la data și ora curentă de pe server
        );

        await client.close();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};