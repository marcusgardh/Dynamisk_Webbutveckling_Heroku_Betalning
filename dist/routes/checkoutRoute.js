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

router.get(ROUTE.cart, verifyToken, async function (req, res) {
    var user = await UserModel.findOne({ _id: req.body.user._id }).populate('shoppingcart.productId');

    res.status(200).render(VIEW.cart, { ROUTE: ROUTE, user: user, token: req.cookies.jsonwebtoken !== undefined ? true : false });
});

router.get(ROUTE.checkout, verifyToken, async function (req, res) {

    var user = await UserModel.findOne({ _id: req.body.user._id }).populate('shoppingcart.productId');

    if (user.shoppingcart.length <= 0) {
        res.redirect("://" + req.get("Host") + ROUTE.error + "?errmsg=Varukorgen är tom");
    }

    return await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: user.shoppingcart.map(function (product) {
            return {
                name: product.productId.album,
                amount: product.productId.price * 100, //öre *100 = 1 kronor
                quantity: product.quantity,
                currency: "sek"
            };
        }),
        // customer: user.firstName + " " + user.lastName,
        customer_email: user.email,
        success_url: req.protocol + "://" + req.get("Host") + ROUTE.confirmation,
        cancel_url: req.protocol + "://" + req.get("Host") + ROUTE.error + "?errmsg=Betalningen gick inte igenom"
        // ":" + process.env.PORT + 

    }).then(function (session) {
        console.log(session);
        console.log(session.id);
        res.status(202).render(VIEW.checkout, { ROUTE: ROUTE, user: user, sessionId: session.id, token: req.cookies.jsonwebtoken !== undefined ? true : false });
    });
});

router.get(ROUTE.confirmation, verifyToken, async function (req, res) {
    var user = await UserModel.findOne({ _id: req.body.user._id });
    user.emptyShoppingCart();

    res.status(200).render(VIEW.confirmation, { ROUTE: ROUTE, user: user, token: req.cookies.jsonwebtoken !== undefined ? true : false });
});

module.exports = router;