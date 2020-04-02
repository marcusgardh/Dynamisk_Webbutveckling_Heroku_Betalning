'use strict';

var express = require('express');
var router = express.Router();

var _require = require('../constant'),
    ROUTE = _require.ROUTE,
    VIEW = _require.VIEW;

var UserModel = require("../model/user");
var verifyToken = require("./verifyToken");

router.get(ROUTE.checkout, verifyToken, async function (req, res) {
    if (verifyToken) {
        var showUserInfo = await UserModel.findOne({ _id: req.body.userInfo._id }).populate('wishlist.productId', {
            artist: 1,
            album: 1,
            price: 1
        });
        res.status(202).render(VIEW.checkout, { ROUTE: ROUTE, showUserInfo: showUserInfo, token: req.cookies.jsonwebtoken !== undefined ? true : false });
    } else {
        return res.status(202).render(VIEW.checkout, {
            ROUTE: ROUTE,
            showUserInfo: "empty cart",
            token: req.cookies.jsonwebtoken !== undefined ? true : false
        });
    }
});

router.post(ROUTE.checkout, verifyToken, function (req, res) {
    var customer = {
        fName: req.body.fName,
        lName: req.body.lName,
        address: req.body.address,
        city: req.body.city,
        email: req.body.email
    };
    res.render(VIEW.confirmation, {
        customer: customer,
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});

module.exports = router;