'use strict';

var express = require('express');
var router = express.Router();
var ProductModel = require('../model/product');

var _require = require('../constant'),
    ROUTE = _require.ROUTE,
    VIEW = _require.VIEW,
    PRODUCT = _require.PRODUCT;

var request = require('request');
var config = require('../config/config');
var url = require("url");
var verifyAdminToken = require('./verifyAdminToken');

router.get(ROUTE.admin, verifyAdminToken, async function (req, res) {
    var productList = (await ProductModel.find().populate('user', { _id: 1 })).reverse();
    res.render(VIEW.admin, {
        productList: productList,
        ROUTE: ROUTE,
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});

router.post(ROUTE.admin, verifyAdminToken, function (req, res) {
    var artistSearchValue = req.body.artist;
    var albumSearchValue = req.body.album;

    function fetchSpotifyApiData(artistSearchValue, albumSearchValue) {
        var client_id = config.spotify.client_id;
        var client_secret = config.spotify.client_secret;
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
            },
            form: {
                grant_type: 'client_credentials'
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var spotifyToken = body.access_token;
                var options = {
                    url: 'https://api.spotify.com/v1/search?q=album:' + albumSearchValue + '%20artist:' + artistSearchValue + '&type=album&q=',
                    headers: {
                        Authorization: 'Bearer ' + spotifyToken,
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    }
                };
                request.get(options, function (error, response, body) {
                    var spotifyResponse = JSON.parse(body).albums;
                    var userInfo = req.body.userInfo;
                    if (spotifyResponse.items == 0) {
                        res.redirect(url.format({
                            pathname: ROUTE.error,
                            query: {
                                errmsg: 'Titeln saknas hos spotify!'
                            }
                        }));
                    } else {
                        var genres = PRODUCT.genres.filter(function (genre) {
                            return genre !== "All";
                        });
                        res.render(VIEW.adminAddProduct, {
                            ROUTE: ROUTE,
                            userInfo: userInfo,
                            spotifyResponse: spotifyResponse,
                            genres: genres,
                            token: req.cookies.jsonwebtoken !== undefined ? true : false
                        });
                    }
                });
            }
        });
    }
    fetchSpotifyApiData(artistSearchValue, albumSearchValue);
});

router.post(ROUTE.adminAddProduct, verifyAdminToken, async function (req, res) {
    var genres = ["All"];
    for (var property in req.body) {
        if (property.includes("genre")) {
            genres.push(property.replace("genre", ""));
        }
    }
    var product = await new ProductModel({
        artist: req.body.artist,
        album: req.body.album,
        tracks: req.body.tracks,
        spotifyId: req.body.spotifyId,
        imgUrl: req.body.imgUrl,
        genre: genres,
        price: req.body.price,
        addedBy: req.body.adminName,
        user: req.body.userInfo._id
    });
    product.validate(function (err) {
        if (err) {
            console.log(err);
            res.redirect(url.format({
                pathname: ROUTE.error,
                query: {
                    errmsg: 'Valideringsfel i Mongoose'
                }
            }));
        } else {
            product.save();
            res.redirect(ROUTE.admin);
        }
    });
});

module.exports = router;