'use strict';

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

var mongoDB = {
    databaseUrl: process.env.MONGO_DB
};

var spotify = {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
};

var mailkey = {
    mailkey: process.env.SEND_GRID_KEY
};

var tokenkey = {
    adminjwt: process.env.ADMIN_TOKEN,
    userjwt: process.env.USER_TOKEN
};

var admin = {
    adminPassword: process.env.ADMIN_PASSWORD
};

module.exports = { mongoDB: mongoDB, spotify: spotify, mailkey: mailkey, tokenkey: tokenkey, admin: admin };