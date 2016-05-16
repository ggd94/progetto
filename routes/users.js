var express = require('express');
var router = express.Router();
var request = require('request');
var crypto = require('crypto');
var FirebaseTokenGenerator = require("firebase-token-generator");
var multer = require('multer');
var upload = multer({
    dest: 'public/uploads/'
});
var fs = require('fs');
var key=require('../key');


var FIREBASE_SECRET = key.firebase_secret;
var tokenGenerator = new FirebaseTokenGenerator(FIREBASE_SECRET);
var token = tokenGenerator.createToken({
    uid: key.uid_firebase
});

var ALGORITHM = 'aes-256-ctr';
var CRYPTO_PASS = key.crypto_pass;


var APP_ID_FACEBOOK = key.app_id_fb;
var APP_SECRET_FB = key.app_secret_fb;
var URL_OAUTH = 'https://graph.facebook.com/v2.6/oauth/access_token';
var URL = 'https://www.facebook.com/dialog/oauth?client_id=' + APP_ID_FACEBOOK + '&redirect_uri=https://app-ggd94.c9users.io/users/FBLogin/confirm&scope=email,user_location,user_hometown,user_tagged_places,user_photos,user_friends,publish_actions';

/******************************ADD PLACE******************************/

router.post('/addplace', upload.any(), function(req, res, next) {
    console.log("entrato");
    var decipher_accesstoken = crypto.createDecipher(ALGORITHM, CRYPTO_PASS);
    var access_token = decipher_accesstoken.update(req.body.at, 'hex', 'utf8');
    access_token += decipher_accesstoken.final('utf8');

    var decipher_ap = crypto.createDecipher(ALGORITHM, CRYPTO_PASS);
    var app_secret = decipher_ap.update(req.body.asp, 'hex', 'utf8');
    app_secret += decipher_ap.final('utf8');

    var city = req.body.city;
    request.get({
        url: 'https://graph.facebook.com/v2.6/search',
        qs: {
            type: "place",
            q: city,
            access_token: access_token,
            appsecret_proof: app_secret
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var parse = JSON.parse(body);
            var id_city = parse.data[0].id;
            var count = 0,
                array_id = [];

            for (var index in req.files) {
                fs.rename(req.files[index].path, req.files[index].path + '.jpg');
                var path = '' + req.files[index].path;
                var sub_path = path.substring(6, path.length);
                console.log(sub_path);
                request.post({
                    url: 'https://graph.facebook.com/v2.6/me/photos',
                    qs: {
                        published: false,
                        url: "https://app-ggd94.c9users.io" + sub_path + '.jpg',
                        place: id_city,
                        access_token: access_token,
                        appsecret_proof: app_secret
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        count++;
                        var parse = JSON.parse(body);
                        array_id.push({
                            media_fbid: parse.id
                        });
                        if (count == req.files.length) {
                            request.post({
                                url: 'https://graph.facebook.com/v2.6/me/feed',
                                qs: {
                                    attached_media: array_id,
                                    place: id_city,
                                    access_token: access_token,
                                    appsecret_proof: app_secret

                                }
                            }, function(error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    res.send('ok');
                                }
                                else {
                                    res.send(body);
                                }
                            })
                        }
                    }
                    else {
                        console.log('errore');
                    }
                });
            }

        }
        else {
            console.log('error');
            res.send(body);
        }
    })
})


/*****************************DATA FRIENDS********************************/

router.post('/dataFriends', function(req, res, next) {
    var id = req.body.id;
    console.log(id);
    var url = 'https://app-giulia.firebaseio.com/Users/' + id + '.json';
    request.get({
        url: url,
        qs: {
            auth: token
        },
        json: true,
        headers: {
            "content-type": "application/json"
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var persona = response.body;
            var photo;
            if (persona.Person.hasOwnProperty('photos')) photo = persona.Person.photos
            else photo = [];
            res.render('home_friends', {
                name: '' + persona.Person.user,
                email: '' + persona.Person.email,
                image: '' + persona.Person.image,
                luoghi: JSON.stringify(persona.Person.luoghi),
                photos: JSON.stringify(photo)
            });
        }
        else {
            res.json(response.statusCode, {
                error: error
            });
        }
    });
});

/********************************SEARCH PLACE**************************/

router.post('/luogoCercato', function(req, res, next) {
    var luogo = req.body.place;
    var friends = JSON.parse(req.body.friend);
    var count = 0,
        len = friends.length;
    var name = '';
    for (var i = 0; i < len; i++) {
        var id = friends[i].id;
        var url = 'https://app-giulia.firebaseio.com/Users/' + id + '.json';
        request.get({
            url: url,
            qs: {
                auth: token
            },
            json: true,
            headers: {
                "content-type": "application/json"
            }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (response.body == null) {
                    count += 1;
                }
                else {
                    var nome = response.body.Person.user;
                    var place = response.body.Person.luoghi;
                    for (var l = 0; l < place.length; l++) {
                        if (place[l].place.hasOwnProperty('location') && place[l].place.location.hasOwnProperty('city') && place[l].place.location.city.toLowerCase() == luogo.toLowerCase()) {
                            name += '<p id="name-window">' + nome + '</p><br>';
                            break;
                        }
                    }
                    count += 1;
                    if (count == len) res.json({
                        names: name
                    });
                }
            }
            else {
                console.log(error);
                res.json({
                    names: 'problema'
                })
            }
        });
    }
});


/**************************************LOGIN FACEBOOK*********************************/

/*funzione invocata al click del bottone per login facebook*/
router.get('/FBLogin', function(req, res, next) {
    res.redirect('https://app-ggd94.c9users.io/users/FBLogin/confirm');
});

/*-----------------------------------login tramite facebook chiedendo conferma al client-----------------------------*/
router.get('/FBLogin/confirm', function(req, res, next) {
    var USERNAME, ID, EMAIL, PHOTOS = [],
        IMAGE, FRIENDS, LUOGHI;
    var ACCESS_TOKEN, APPSECRET_PROOF;
    console.log(req.query);
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
                ACCESS_TOKEN = element.access_token;
                APPSECRET_PROOF = crypto.createHmac('SHA256', APP_SECRET_FB).update(ACCESS_TOKEN).digest('hex');

                var cipher_accessToken = crypto.createCipher(ALGORITHM, CRYPTO_PASS);
                var crypted_accessToken = cipher_accessToken.update(ACCESS_TOKEN, 'utf8', 'hex');
                crypted_accessToken += cipher_accessToken.final('hex');

                var cipher_appsecretProof = crypto.createCipher(ALGORITHM, CRYPTO_PASS)
                var crypted_appsecretProof = cipher_appsecretProof.update(APPSECRET_PROOF, 'utf8', 'hex');
                crypted_appsecretProof += cipher_appsecretProof.final('hex');


                request.get({
                    url: 'https://graph.facebook.com/v2.6/me/photos',
                    qs: {
                        fields: "images,place",
                        access_token: ACCESS_TOKEN,
                        appsecret_proof: APPSECRET_PROOF
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var array = JSON.parse(body).data;
                        for (var i = 0; i < array.length; i++) {
                            if (array[i].hasOwnProperty('place')) {
                                PHOTOS.push(array[i]);
                            }
                        }
                    }
                    else {
                        console.log(error);
                    }
                });

                request.get({
                    url: 'https://graph.facebook.com/v2.6/me',
                    qs: {
                        fields: "name,email,picture,tagged_places,friends",
                        access_token: ACCESS_TOKEN,
                        appsecret_proof: APPSECRET_PROOF
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        USERNAME = JSON.parse(body).name;
                        ID = JSON.parse(body).id;
                        EMAIL = JSON.parse(body).email;
                        IMAGE = JSON.parse(body).picture.data.url;
                        LUOGHI = JSON.parse(body).tagged_places.data;
                        FRIENDS = JSON.parse(body).friends.data;

                        /************************** SALVO DATI IN FIREBASE ********************************/


                        var FIREBASE_URL = 'https://app-giulia.firebaseio.com/Users/' + ID + '.json';
                        var requestData = {
                            "Person": {
                                user: USERNAME,
                                email: EMAIL,
                                image: IMAGE,
                                luoghi: LUOGHI,
                                photos: PHOTOS,
                                friends: FRIENDS
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
                                    name: USERNAME,
                                    email: EMAIL,
                                    photo: IMAGE,
                                    luoghi: JSON.stringify(LUOGHI),
                                    photos: JSON.stringify(PHOTOS),
                                    friends: JSON.stringify(FRIENDS),
                                    at: crypted_accessToken,
                                    asp: crypted_appsecretProof
                                });
                            }
                            else {
                                console.log(error);
                            }
                        });

                        /*************************** FINE SALVATAGGIO ***************************************/

                    }
                    else {
                        console.log(error);
                    }
                });
            }
        });
    }
});

/*---------------------------------------------------------------------------------------------FINE LOGIN FACEBOOK------------------------------------------------------------------*/


/*gestione della url di HOMEPAGE una volta loggati*/
router.post('/', function(req, res, next) {
    var options = {
        root: __dirname + "/../public/html/",
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    var fileName = 'home.html';
    res.sendFile(fileName, options, function(err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        }
        else {
            console.log('Sent:', fileName);
        }
    });

});



module.exports = router;
