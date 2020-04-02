'use strict';

var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var crypto = require("crypto");
var UserInfoModel = require('../model/user');
var ProductModel = require("../model/product");
var config = require('../config/config');

var _require = require('../constant'),
    ROUTE = _require.ROUTE,
    VIEW = _require.VIEW;

var jwt = require('jsonwebtoken');
var verifyToken = require("./verifyToken");
var nodemailer = require("nodemailer");
var sendgridTransport = require("nodemailer-sendgrid-transport");
var url = require("url");
var transport = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: config.mailkey.mailkey
    }
}));

router.get(ROUTE.createUser, function (req, res) {
    res.status(200).render(VIEW.createUser, {
        ROUTE: ROUTE,
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});
router.post(ROUTE.createUser, async function (req, res) {
    var salt = await bcrypt.genSalt(10);
    var hashPassword = await bcrypt.hash(req.body.password, salt);
    if (req.body.adminpass == config.admin.adminPassword) {
        await new UserInfoModel({
            isAdmin: true,
            email: req.body.email,
            password: hashPassword,
            address: req.body.address,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        }).save();
    } else {
        try {
            await new UserInfoModel({
                email: req.body.email,
                password: hashPassword,
                address: req.body.address,
                firstName: req.body.firstName,
                lastName: req.body.lastName
            }).save();
        } catch (error) {
            res.redirect(url.format({
                pathname: ROUTE.error,
                query: {
                    errmsg: 'emailet-adressen är upptagen,försök igen! :)'
                }
            }));
        }
    }
    var userInfo = await UserInfoModel.findOne({
        email: req.body.email
    });
    if (!userInfo) return res.redirect(url.format({
        pathname: ROUTE.error,
        query: {
            errmsg: 'Fel email!'
        }
    }));
    var validUser = await bcrypt.compare(req.body.password, userInfo.password);
    if (!validUser) return res.render("errors", {
        errmsg: 'Fel lösenord!',
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
    var tokenSignature = userInfo.isAdmin ? config.tokenkey.adminjwt : config.tokenkey.userjwt;
    jwt.sign({
        userInfo: userInfo
    }, tokenSignature, function (err, token) {
        if (err) return res.render('errors', {
            errmsg: 'token funkar inte',
            token: req.cookies.jsonwebtoken !== undefined ? true : false
        });
        if (token) {
            var cookie = req.cookies.jsonwebtoken;
            if (!cookie) {
                res.cookie('jsonwebtoken', token, {
                    maxAge: 3500000,
                    httpOnly: true
                });
            }
            if (tokenSignature == config.tokenkey.adminjwt) return res.redirect(VIEW.admin);
            if (tokenSignature == config.tokenkey.userjwt) return res.redirect(VIEW.userAccount);
        }
    });
});

router.get(ROUTE.login, async function (req, res) {
    res.status(200).render(VIEW.login, {
        ROUTE: ROUTE,
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});

router.post(ROUTE.login, async function (req, res) {
    var userInfo = await UserInfoModel.findOne({
        email: req.body.email
    });
    if (!userInfo) return res.redirect(url.format({
        pathname: ROUTE.error,
        query: {
            errmsg: 'Fel email!'
        }
    }));

    var validUser = await bcrypt.compare(req.body.password, userInfo.password);
    if (!validUser) return res.redirect(url.format({
        pathname: ROUTE.error,
        query: {
            errmsg: 'Fel lösenord!'
        }
    }));else {
        var tokenSignature = userInfo.isAdmin ? config.tokenkey.adminjwt : config.tokenkey.userjwt;
        jwt.sign({
            userInfo: userInfo
        }, tokenSignature, function (err, token) {
            if (err) return res.redirect(url.format({
                pathname: ROUTE.error,
                query: {
                    errmsg: 'Token fungerar ej!'
                }
            }));
            if (token) {
                var cookie = req.cookies.jsonwebtoken;
                if (!cookie) {
                    res.cookie('jsonwebtoken', token, {
                        maxAge: 3500000,
                        httpOnly: true
                    });
                }
                if (userInfo.isAdmin) {
                    res.redirect(ROUTE.admin);
                } else {
                    res.redirect(ROUTE.userAccount);
                }
            }
        });
    }
});

router.get(ROUTE.userAccount, verifyToken, async function (req, res) {
    var loggedIn = jwt.decode(req.cookies.jsonwebtoken).userInfo;
    var user = await UserInfoModel.findOne({
        _id: req.body.userInfo._id
    }).populate('wishlist.productId', {
        artist: 1,
        album: 1,
        price: 1
    });

    res.status(200).render(VIEW.userAccount, {
        ROUTE: ROUTE,
        loggedIn: loggedIn,
        user: user,
        token: req.cookies.jsonwebtoken !== undefined ? true : false,
        passwordChanged: {
            exists: req.query.passwordChanged ? true : false,
            value: req.query.passwordChanged == 'true' ? true : false
        }
    });
});

router.post(ROUTE.userAccount, async function (req, res) {
    var loggedIn = jwt.decode(req.cookies.jsonwebtoken).userInfo;
    if (await bcrypt.compare(req.body.currentpassword, loggedIn.password)) {
        var salt = await bcrypt.genSalt(10);
        var newHashPassword = await bcrypt.hash(req.body.newpassword, salt);
        await UserInfoModel.updateOne({
            email: loggedIn.email
        }, {
            $set: {
                password: newHashPassword
            }
        }, {
            runValidators: true
        }, function (error, success) {
            if (error) {
                res.redirect(url.format({
                    pathname: ROUTE.error,
                    query: {
                        errmsg: error._message
                    }
                }));
            } else {
                res.redirect(url.format({
                    pathname: ROUTE.userAccount,
                    query: {
                        passwordChanged: "true"
                    }
                }));
            }
        });
    } else {
        res.redirect(url.format({
            pathname: ROUTE.userAccount,
            query: {
                passwordChanged: "false"
            }
        }));
    }
});

router.get(ROUTE.wishlistId, verifyToken, async function (req, res) {
    if (verifyToken) {
        var product = await ProductModel.findOne({
            _id: req.params.id
        });
        var user = await UserInfoModel.findOne({
            _id: req.body.userInfo._id
        });
        user.addToWishlist(product);
        return res.redirect(ROUTE.userAccount);
    } else {
        res.redirect(url.format({
            pathname: ROUTE.error,
            query: {
                errmsg: 'Du måste logga in för att lägga till produkten i din önskelista!'
            }
        }));
    }
});

router.get(ROUTE.wishlistRemoveId, verifyToken, async function (req, res) {
    var user = await UserInfoModel.findOne({
        _id: req.body.userInfo._id
    });
    user.removeWishList(req.params.id);
    res.redirect(ROUTE.userAccount);
});

router.get(ROUTE.resetpassword, function (req, res) {
    res.status(200).render(VIEW.resetpassword, {
        ROUTE: ROUTE,
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});

router.post(ROUTE.resetpassword, async function (req, res) {
    var user = await UserInfoModel.findOne({
        email: req.body.resetmail
    });
    if (!user) return res.redirect(ROUTE.error);
    crypto.randomBytes(32, async function (error, token) {
        if (error) return res.redirect(ROUTE.error);
        var resetToken = token.toString("hex");
        user.resetToken = resetToken;
        user.expirationToken = Date.now() + 3600000;
        await user.save();
        await transport.sendMail({
            to: req.body.resetmail,
            from: "<no-reply>vinylshopen@info",
            subject: "Ändra ditt lösenord!",
            html: 'http://localhost:8080/resetpassword/' + resetToken + ' <h2>Klicka p\xE5 l\xE4nken f\xF6r att \xE4ndra ditt l\xF6senord! L\xE4nken \xE4r giltig i 1 timme.<h2>'
        });
        res.redirect(ROUTE.login);
    });
});

router.get(ROUTE.resetpasswordToken, async function (req, res) {
    var token = req.params.token;
    var user = await UserInfoModel.findOne({
        resetToken: token,
        expirationToken: {
            $gt: Date.now()
        }
    });
    if (!user) return res.redirect(ROUTE.error);
    res.render(VIEW.resetform, {
        user: user,
        ROUTE: ROUTE,
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});

router.post(ROUTE.resetpasswordToken, async function (req, res) {
    var user = await UserInfoModel.findOne({
        resetToken: req.body.token
    });
    if (user) {
        var hashPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashPassword;
        user.resetToken = undefined;
        user.expirationToken = undefined;
        await user.save();
        return res.redirect(ROUTE.login);
    }
    return res.redirect(ROUTE.error);
});

router.get(ROUTE.logout, function (req, res) {
    res.clearCookie("jsonwebtoken").redirect(ROUTE.index);
});

module.exports = router;