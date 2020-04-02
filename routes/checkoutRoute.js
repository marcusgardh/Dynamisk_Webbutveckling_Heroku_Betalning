const express = require('express')
const router = express.Router()
const { ROUTE, VIEW } = require('../constant')
const config = require('../config/config')
const UserModel = require("../model/user")
const verifyToken = require('./verifyToken')
const stripe = require('stripe')(config.stripe.secret_key)

router.get(ROUTE.checkout, verifyToken, async (req, res) => {
    
    const userInfo = await UserModel.findOne({ _id: req.body.userInfo._id }).populate('wishlist.productId')

        return await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: userInfo.wishlist.map((product)=>{
                return {
                    name: product.productId.album,
                    amount:product.productId.price * 100, //öre *100 = 1 kronor
                    quantity: 1, 
                    currency:"sek"
                }
            }),
            success_url: req.protocol +   "://" + req.get("Host") +  "/",
            cancel_url: 'http://localhost:8080/error'
            // ":" + process.env.PORT + 
        
        }).then( (session)=>{
            console.log(session)
            console.log(session.id)
            res.status(202).render(VIEW.checkout, { ROUTE, userInfo, sessionId:session.id, token: (req.cookies.jsonwebtoken !== undefined) ? true : false })
        })
    
})

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
