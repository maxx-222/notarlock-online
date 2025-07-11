// functions/logout.js
const cookie = require('cookie');

exports.handler = async () => {
    // Șterge cookie-ul setându-i data de expirare în trecut
    const sessionCookie = cookie.serialize('nf_jwt', '', {
        httpOnly: true,
        secure: true,
        path: '/',
        expires: new Date(0), // Data de expirare în trecut
    });

    return {
        statusCode: 200,
        headers: { 'Set-Cookie': sessionCookie },
        body: JSON.stringify({ success: true }),
    };
};