'use strict';

var express = require('express');
var router = express.Router();
var Product = require('../model/product');

var _require = require('../constant'),
    ROUTE = _require.ROUTE,
    VIEW = _require.VIEW,
    PRODUCT = _require.PRODUCT;

var url = require('url');

router.get(ROUTE.index, async function (req, res) {
    var displayList = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = PRODUCT.genres[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var genre = _step.value;

            var img = await Product.findOne({ genre: genre }, { imgUrl: 1, _id: 0 });
            if (img) {
                displayList.push({
                    img: img.imgUrl,
                    genre: genre
                });
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    res.render(VIEW.index, {
        displayList: displayList,
        productListRoute: ROUTE.gallery,
        token: req.cookies.jsonwebtoken !== undefined ? true : false
    });
});

router.get(ROUTE.product, async function (req, res) {
    var oneProduct = await Product.findById({ _id: req.params.id });
    res.render(VIEW.product, { oneProduct: oneProduct, token: req.cookies.jsonwebtoken !== undefined ? true : false });
});

router.get(ROUTE.gallery, async function (req, res) {
    if (Object.keys(req.query).length === 0) {
        res.redirect(url.format({
            pathname: ROUTE.gallery,
            query: {
                "genre": "All",
                "page": 1
            }
        }));
    } else {
        validatePage(req.query).then(async function (query) {
            return await validateGenre(query);
        }).then(async function (queryObject) {
            return await getData(queryObject, req.cookies.jsonwebtoken);
        }).then(async function (object) {
            res.render(VIEW.gallery, object);
        }).catch(function (error) {
            console.error(error);
            res.redirect(url.format({
                pathname: ROUTE.error,
                query: {
                    errmsg: error.errmsg
                }
            }));
        });
    }
});

var validatePage = async function validatePage(query) {
    return new Promise(async function (resolve, reject) {
        if (Number.isInteger(+query.page)) {
            resolve(query);
        } else {
            var error = new Error();
            error.name = "Invalid Query";
            error.description = "page is not an integer";
            error.errmsg = "Kunde inte hitta sidan";
            reject(error);
        }
    });
};

var validateGenre = async function validateGenre(query) {
    return new Promise(async function (resolve, reject) {
        if (query.genre !== undefined) {
            var correct = true;
            var genres = query.genre.split(",");
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = genres[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var genre = _step2.value;

                    if (!PRODUCT.genres.includes(genre)) {
                        correct = false;
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            if (correct) {
                var queryObject = {
                    genres: genres,
                    page: +query.page
                };
                resolve(queryObject);
            } else {
                var error = new Error();
                error.name = "Invalid Query";
                error.description = "genre does not exist";
                error.errmsg = "Kunde inte hitta sidan";
                reject(error);
            }
        } else {
            var _error = new Error();
            _error.name = "Invalid Query";
            _error.description = "genre is undefined";
            _error.errmsg = "Kunde inte hitta sidan";
            reject(_error);
        }
    });
};

var getData = async function getData(queryObject, token) {
    return new Promise(async function (resolve, reject) {
        var page = queryObject.page;
        var genres = queryObject.genres;
        var productAmount = 0;
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = genres[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _genre = _step3.value;

                productAmount += await Product.find({ genre: _genre }).countDocuments();
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        var pageAmount = Math.ceil(productAmount / PRODUCT.perPage);
        if (page >= 1 && page <= pageAmount) {
            var perGenre = Math.ceil(PRODUCT.perPage / genres.length);
            var productList = [];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = genres[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var genre = _step4.value;

                    productList = productList.concat((await Product.find({ genre: genre }).skip(perGenre * (page - 1)).limit(perGenre)));
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            var genreString = genres.toString();
            resolve({
                token: token !== undefined ? true : false,
                productList: productList,
                productAmount: productAmount,
                currentPage: page,
                isFirst: page <= 1,
                isSecond: page === 2,
                isLast: page === pageAmount,
                isSecondLast: page === pageAmount - 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: pageAmount,
                ROUTE: ROUTE,
                genre: genreString
            });
        } else {
            var error = new Error();
            error.name = "Invalid Query";
            error.description = "page is not within range";
            error.errmsg = "Kunde inte hitta sidan";
            reject(error);
        }
    });
};

module.exports = router;