var request = require('request');
var crypto = require('crypto');
var FirebaseTokenGenerator = require("firebase-token-generator");

var key = require('../key');
var FIREBASE_SECRET = key.firebase_secret;
var tokenGenerator = new FirebaseTokenGenerator(FIREBASE_SECRET);
var token = tokenGenerator.createToken({
    uid: key.uid_firebase
});

var ALGORITHM = 'aes-256-ctr';
var CRYPTO_PASS = key.crypto_pass;
var CRYPTO_PASS_RABBIT=key.crypto_pass_rabbit;


var APP_ID_FACEBOOK = key.app_id_fb;
var APP_SECRET_FB = key.app_secret_fb;
var URL_OAUTH = 'https://graph.facebook.com/v2.6/oauth/access_token';
var URL = 'https://www.facebook.com/dialog/oauth?client_id=' + APP_ID_FACEBOOK + '&redirect_uri=https://app-ggd94.c9users.io/users/FBLogin/confirm&scope=email,user_location,user_hometown,user_tagged_places,user_photos,user_friends,publish_actions,user_posts';



var cb0 = function(req, res, next) {
    if (!req.query.hasOwnProperty('code')) {
        res.redirect(URL);
    }
    else {
        var code = req.query.code;
        request.get({
            url: URL_OAUTH,
            qs: {
                client_id: APP_ID_FACEBOOK,
                redirect_uri: 'https://app-ggd94.c9users.io/users/FBLogin/confirm',
                client_secret: APP_SECRET_FB,
                code: code
            }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var element = JSON.parse(body);
                req.ACCESS_TOKEN = element.access_token;
                req.APPSECRET_PROOF = crypto.createHmac('SHA256', APP_SECRET_FB).update(req.ACCESS_TOKEN).digest('hex');

                var cipher_accessToken = crypto.createCipher(ALGORITHM, CRYPTO_PASS);
                req.crypted_accessToken = cipher_accessToken.update(req.ACCESS_TOKEN, 'utf8', 'hex');
                req.crypted_accessToken += cipher_accessToken.final('hex');

                var cipher_appsecretProof = crypto.createCipher(ALGORITHM, CRYPTO_PASS)
                req.crypted_appsecretProof = cipher_appsecretProof.update(req.APPSECRET_PROOF, 'utf8', 'hex');
                req.crypted_appsecretProof += cipher_appsecretProof.final('hex');
                next();
            }
            else {
                res.send(body).end();
            }
        })
    }
};

var cb1 = function(req, res, next) {
    req.PHOTOS = [];
    request.get({
        url: 'https://graph.facebook.com/v2.6/me/photos',
        qs: {
            fields: "images,place",
            access_token: req.ACCESS_TOKEN,
            appsecret_proof: req.APPSECRET_PROOF
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var array = JSON.parse(body).data;
            for (var i = 0; i < array.length; i++) {
                if (array[i].hasOwnProperty('place')) {
                    req.PHOTOS.push(array[i]);
                }
            }
            next();
        }
        else {
            res.send(body).end();
        }
    })
};

var cb2 = function(req, res, next) {
    request.get({
        url: 'https://graph.facebook.com/v2.6/me',
        qs: {
            fields: "name,email,picture,tagged_places,friends",
            access_token: req.ACCESS_TOKEN,
            appsecret_proof: req.APPSECRET_PROOF
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            req.USERNAME = JSON.parse(body).name;
            req.ID = JSON.parse(body).id;
            req.EMAIL = JSON.parse(body).email;
            req.IMAGE = JSON.parse(body).picture.data.url;
            if(JSON.parse(body).hasOwnProperty('tagged_places') && JSON.parse(body).tagged_places.hasOwnProperty('data')) req.LUOGHI = JSON.parse(body).tagged_places.data;
            else req.LUOGHI=[];
            if(JSON.parse(body).hasOwnProperty('friends') && JSON.parse(body).friends.hasOwnProperty('data')) req.FRIENDS = JSON.parse(body).friends.data;
            else req.FRIENDS=[];
            var cipher= crypto.createCipher(ALGORITHM, CRYPTO_PASS_RABBIT);
            req.crypted_id = cipher.update(JSON.parse(body).id, 'utf8', 'hex');
            req.crypted_id += cipher.final('hex');
            next();
        }
        else {
            res.send(body).end();
        }
    })
};


var cb3=function(req,res,next){
    request.get({
        url: 'https://graph.facebook.com/v2.6/me/feed',
        qs:{
            fields:"place,attachments",
            access_token: req.ACCESS_TOKEN,
            appsecret_proof: req.APPSECRET_PROOF
        }
    },function(error,response,body){
        req.FEED=[];
       if (!error && response.statusCode == 200) {
            var array = JSON.parse(body).data;
            for (var i = 0; i < array.length; i++) {
                if (array[i].hasOwnProperty('place') && array[i].place.hasOwnProperty('location')) {
                    req.FEED.push(array[i]);
                }
            }
            next();
        }
        else {
            res.send(body).end();
        } 
    })
}
/************************** SALVO DATI IN FIREBASE ********************************/

var cb4 = function(req, res, next) {
    var FIREBASE_URL = 'https://app-giulia.firebaseio.com/Users/' + req.ID + '.json';
     request.get({
        url: FIREBASE_URL,
        qs: {
            auth: token
        },
        json: true,
        headers: {
            "content-type": "application/json"
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200){
            console.log('utente esistente');
            var persona=response.body;
            if(persona==null){
                req.NOTIFICATIONS=[];
                req.number=0;
            }
            else if(persona.Person.hasOwnProperty('notifications')){
                req.NOTIFICATIONS= persona.Person.notifications;
                req.number=persona.Person.number;
            }
            else{
                req.NOTIFICATIONS=[];
                req.number=0;
            }
            next();
        }
        else res.send(body).end();
    })
};
        
        

var cb5=function(req, res, next) {
    var FIREBASE_URL = 'https://app-giulia.firebaseio.com/Users/' + req.ID + '.json'; 
    var requestData= {
        "Person": {
            user: req.USERNAME,
            email: req.EMAIL,
            image: req.IMAGE,
            luoghi: req.LUOGHI,
            photos: req.PHOTOS,
            friends: req.FRIENDS,
            feed: req.FEED,
            notifications:req.NOTIFICATIONS,
            number: req.number
        }
    };
    request.put({
        url: FIREBASE_URL,
        qs: {
            auth: token
        },
        json: true,
        headers: {
            "content-type": "application/json"
        },
        body: requestData
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {

            res.render("home", {
                name: req.USERNAME,
                email: req.EMAIL,
                photo: req.IMAGE,
                luoghi: JSON.stringify(req.LUOGHI),
                photos: JSON.stringify(req.PHOTOS),
                friends: JSON.stringify(req.FRIENDS),
                feed:JSON.stringify(req.FEED),
                crypted_id: req.crypted_id,
                at: req.crypted_accessToken,
                asp: req.crypted_appsecretProof,
                notifications: JSON.stringify(req.NOTIFICATIONS),
                number_notifications:req.number
            });
        }
        else {
            res.send(body).end();
        }
    });
};

var obj_login={
    cb0:cb0,
    cb1:cb1,
    cb2:cb2,
    cb3:cb3,
    cb4:cb4,
    cb5:cb5
};

module.exports=obj_login;