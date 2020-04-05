'use strict';

var VIEW = {
    index: 'index',
    admin: "admin",
    adminAddProduct: 'addProduct',
    createUser: "createuser",
    login: 'login',
    userAccount: 'useraccount',
    gallery: 'gallery',
    product: 'product',
    checkout: 'checkout',
    confirmation: 'confirmation',
    cart: 'cart',
    error: 'errors',
    resetpassword: 'resetpassword',
    resetform: 'resetform'
};

var ROUTE = {
    index: '/',
    admin: '/admin',
    adminAddProduct: '/admin/addproduct',
    login: '/login',
    logout: "/logout",
    userAccount: "/useraccount",
    createUser: "/createuser",
    gallery: '/gallery',
    product: '/gallery/:id',
    wishlist: '/wishlist',
    wishlistId: '/wishlist/:id',
    checkout: '/checkout',
    confirmation: '/confirmation',
    cart: '/cart',
    addToCart: '/cart/add/',
    removeFromCart: '/cart/remove/',
    error: '/*',
    resetpassword: '/resetpassword',
    resetpasswordToken: '/resetpassword/:token',
    wishlistRemoveId: '/remove/:id'
};

var PRODUCT = {
    perPage: 4,
    genres: ["All", "Rock", "Pop", "Soul", "Rap", "Rnb", "Blues"]
};

module.exports = {
    VIEW: VIEW,
    ROUTE: ROUTE,
    PRODUCT: PRODUCT
};