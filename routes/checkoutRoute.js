const express = require('express')
const router = express.Router()
const { ROUTE, VIEW } = require('../constant')
const config = require('../config/config')
const UserModel = require("../model/user")
const verifyToken = require('./verifyToken')
const stripe = require('stripe')(config.stripe.secret_key)

router.get(ROUTE.cart, verifyToken, async (req, res) => {
    const user = await UserModel.findOne({ _id: req.body.user._id }).populate('shoppingcart.productId')

    res.status(200).render(VIEW.cart, {ROUTE, user, token: (req.cookies.jsonwebtoken !== undefined) ? true : false})
})

router.get(ROUTE.checkout, verifyToken, async (req, res) => {
    
    const user = await UserModel.findOne({ _id: req.body.user._id }).populate('shoppingcart.productId') 

    if (user.shoppingcart.length <= 0) {
        res.redirect("://" + req.get("Host") + ROUTE.error + "?errmsg=Varukorgen är tom")
    }

    return await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: user.shoppingcart.map((product)=>{
            return {
                name: product.productId.album,
                amount:product.productId.price * 100, //öre *100 = 1 kronor
                quantity: product.quantity, 
                currency:"sek"
            }
        }),
        // customer: user.firstName + " " + user.lastName,
        customer_email: user.email,
        success_url: req.protocol +   "://" + req.get("Host") + ROUTE.confirmation,
        cancel_url: req.protocol +   "://" + req.get("Host") + ROUTE.error + "?errmsg=Betalningen gick inte igenom"
        // ":" + process.env.PORT + 
    
    }).then( (session)=>{
        console.log(session)
        console.log(session.id)
        res.status(202).render(VIEW.checkout, { ROUTE, user, sessionId:session.id, token: (req.cookies.jsonwebtoken !== undefined) ? true : false })
    })
    
})

router.get(ROUTE.confirmation, verifyToken, async (req, res) => {
    const user = await UserModel.findOne({ _id: req.body.user._id })
    user.emptyShoppingCart()

    res.status(200).render(VIEW.confirmation, { ROUTE, user, token: (req.cookies.jsonwebtoken !== undefined) ? true : false })
})

module.exports = router;
