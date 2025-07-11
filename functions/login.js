// functions/login.js
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { username, password } = JSON.parse(event.body);

    // Verifică credențialele cu cele din variabilele de mediu
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        // Dacă sunt corecte, creează un token (JWT)
        const token = jwt.sign(
            { user: username, roles: ['admin'] }, // Payload-ul token-ului
            process.env.JWT_SECRET, // Secretul pentru semnare
            { expiresIn: '8h' } // Token-ul expiră în 8 ore
        );

        // Setează token-ul într-un cookie securizat
        const sessionCookie = cookie.serialize('nf_jwt', token, {
            httpOnly: true, // Nu poate fi accesat de JavaScript-ul din browser
            secure: true,   // Trimis doar prin HTTPS
            path: '/',
            maxAge: 8 * 60 * 60 // 8 ore în secunde
        });

        return {
            statusCode: 200,
            headers: { 'Set-Cookie': sessionCookie },
            body: JSON.stringify({ success: true }),
        };
    } else {
        return {
            statusCode: 401, // Unauthorized
            body: JSON.stringify({ success: false, message: 'User sau parolă incorectă.' }),
        };
    }
};