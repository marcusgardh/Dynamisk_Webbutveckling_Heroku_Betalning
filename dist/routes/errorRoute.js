'use strict';

var express = require('express');
var router = express.Router();
var constant = require('../constant');

router.get(constant.ROUTE.error, function (req, res) {
    res.status(404).render(constant.VIEW.error, {
        errmsg: req.query.errmsg || '404. Sidan finns inte!',
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});

module.exports = router;