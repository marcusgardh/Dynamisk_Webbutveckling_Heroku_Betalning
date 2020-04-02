'use strict';

var jwt = require('jsonwebtoken');
var config = require('../config/config');

var _require = require('../constant'),
    ROUTE = _require.ROUTE;

var url = require("url");

module.exports = function (req, res, next) {
    var token = req.cookies.jsonwebtoken;
    if (token) {
        jwt.verify(token, config.tokenkey.adminjwt, function (err, result) {
            if (err) {
                return res.redirect(url.format({
                    pathname: ROUTE.error,
                    query: {
                        errmsg: 'Behörighet saknas!'
                    }
                }));
            } else {
                if (result.userInfo.isAdmin == true) {
                    req.body.userInfo = result.userInfo;
                    next();
                } else {
                    res.redirect(ROUTE.index);
                }
            }
        });
    } else {
        res.redirect(url.format({
            pathname: ROUTE.error,
            query: {
                errmsg: 'Du är inte inloggad!'
            }
        }));
    }
};