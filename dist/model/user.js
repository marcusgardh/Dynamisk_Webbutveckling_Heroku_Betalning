"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var mongoose = require('mongoose');
var Schema = require("mongoose").Schema;

var schemaUser = new Schema({
    isAdmin: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        minlength: 2,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        minlength: 2
    },
    lastName: {
        type: String,
        minlength: 2
    },
    address: {
        type: String,
        minlength: 2
    },
    resetToken: String,
    expirationToken: Date,
    wishlist: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product" //det som exporteras i product-model 
        }
    }],
    shoppingcart: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product" //det som exporteras i product-model 
        },
        quantity: Number
    }]
});

schemaUser.methods.addToWishlist = function (product) {
    this.wishlist.push({ productId: product._id });
    var filter = this.wishlist.filter(function (_ref) {
        var productId = _ref.productId;

        return !this.has("" + productId) && this.add("" + productId);
    }, new Set());
    this.wishlist = [].concat(_toConsumableArray(filter));
    return this.save();
};

schemaUser.methods.removeWishList = function (productId) {
    var currentProducts = this.wishlist.filter(function (product) {
        return product.productId.toString() !== productId.toString();
    });
    this.wishlist = currentProducts;
    return this.save();
};

schemaUser.methods.addToShoppingCart = function (product) {

    if (this.shoppingcart && this.shoppingcart.length > 0) {
        console.log("if-sats");
        for (var i = 0; i < this.shoppingcart.length; i++) {
            console.log(this.shoppingcart[i].productId + " " + product._id);
            console.log(this.shoppingcart[i].productId.toString() + " " + product._id.toString());
            console.log(Boolean(this.shoppingcart[i].productId == product._id));
            if (this.shoppingcart[i].productId.toString() == product._id.toString()) {
                console.log("if-sats");
                this.shoppingcart[i].quantity++;
                return this.save();
            }

            console.log(this.shoppingcart);
        }

        console.log("else-sats");
        this.shoppingcart.push({ productId: product._id, quantity: 1 });
        console.log(this.shoppingcart);
        return this.save();
    } else {
        console.log("else-sats");
        this.shoppingcart.push({ productId: product._id, quantity: 1 });
        console.log(this.shoppingcart);
        return this.save();
    }
};

schemaUser.methods.removeShoppingCart = function (productId) {
    for (var i = 0; i < this.shoppingcart.length; i++) {
        if (this.shoppingcart[i].productId._id.toString() == productId.toString()) {
            this.shoppingcart[i].quantity--;

            if (this.shoppingcart[i].quantity < 1) {
                this.shoppingcart.splice(i, 1);
            }

            return this.save();
        }
    }
};

schemaUser.methods.emptyShoppingCart = function () {
    while (this.shoppingcart.length) {
        console.log("pop");
        this.shoppingcart.pop();
    }

    return this.save();
};

var userModel = mongoose.model('User', schemaUser);

module.exports = userModel;