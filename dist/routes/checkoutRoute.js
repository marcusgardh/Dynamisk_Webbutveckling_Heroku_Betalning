'use strict';

var express = require('express');
var router = express.Router();

var _require = require('../constant'),
    ROUTE = _require.ROUTE,
    VIEW = _require.VIEW;

var config = require('../config/config');
var UserModel = require("../model/user");
var verifyToken = require('./verifyToken');
var stripe = require('stripe')(config.stripe.secret_key);

router.get(ROUTE.checkout, verifyToken, async function (req, res) {

    var userInfo = await UserModel.findOne({ _id: req.body.userInfo._id }).populate('wishlist.productId');

    var cookie = req.cookies.shoppingcart;

    return await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: cookie.map(function (product) {
            return {
                name: product.album,
                amount: product.price * 100, //öre *100 = 1 kronor
                quantity: 1,
                currency: "sek"
            };
        }),
        // customer: userInfo.firstName + " " + userInfo.lastName,
        customer_email: userInfo.email,
        success_url: req.protocol + "://" + req.get("Host") + "/",
        cancel_url: 'http://localhost:8080/error'
        // ":" + process.env.PORT + 

    }).then(function (session) {
        console.log(session);
        console.log(session.id);
        res.clearCookie('shoppingcart');
        res.status(202).render(VIEW.checkout, { ROUTE: ROUTE, cookie: cookie, userInfo: userInfo, sessionId: session.id, token: req.cookies.jsonwebtoken !== undefined ? true : false });
    });
});

// router.post(ROUTE.checkout, verifyToken, (req, res) => {
//     const customer = {
//         fName: req.body.fName,
//         lName: req.body.lName,
//         address: req.body.address,
//         city: req.body.city,
//         email: req.body.email
//     }
//     res.render(VIEW.confirmation, {
//         customer,
//         token: (req.cookies.jsonwebtoken !== undefined) ? true : false
//     });
// })

module.exports = router;