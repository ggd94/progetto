var server = require('../server');
var express = server.express;
var router = express.Router();
var request = require('request');
var crypto = require('crypto');
var FirebaseTokenGenerator = require("firebase-token-generator");
var multer = require('multer');
var amqp = require('amqplib/callback_api');

var upload = multer({
    dest: 'public/uploads/'
});
var fs = require('fs');

var key = require('../key');
var login = require('./login');


var FIREBASE_SECRET = key.firebase_secret;
var tokenGenerator = new FirebaseTokenGenerator(FIREBASE_SECRET);
var token = tokenGenerator.createToken({
    uid: key.uid_firebase
});

var ALGORITHM = 'aes-256-ctr';
var CRYPTO_PASS = key.crypto_pass;
var CRYPTO_PASS_RABBIT = key.crypto_pass_rabbit;


var APP_ID_FACEBOOK = key.app_id_fb;
var APP_SECRET_FB = key.app_secret_fb;
var URL = 'https://www.facebook.com/dialog/oauth?client_id=' + APP_ID_FACEBOOK + '&redirect_uri=https://app-ggd94.c9users.io/users/FBLogin/confirm&scope=email,user_location,user_hometown,user_tagged_places,user_photos,user_friends,publish_actions';


router.post('/numberNotifications', function(req, res, next) {
        var q =req.body.rb;
        var number = 0;
        var decipher = crypto.createDecipher(ALGORITHM, CRYPTO_PASS_RABBIT);
        var id = decipher.update(q, 'hex', 'utf8');
        id += decipher.final('utf8');
        var FIREBASE_URL = 'https://app-giulia.firebaseio.com/Users/' + id + '.json';
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
            var persona = response.body;
            var requestData = {
                "Person": {
                    user: persona.Person.user,
                    email: persona.Person.email,
                    image: persona.Person.user,
                    luoghi: persona.Person.luoghi,
                    photos: persona.Person.photos,
                    friends: persona.Person.friends,
                    feed: persona.Person.feed,
                    notifications: persona.Person.notifications,
                    number: number
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
                    console.log('number notifica azzerato');
                }
                else {
                    console.log('problema number notifica');
                }
            })
        })
    })
    /******************************RABBIT RECEIVER******************************/
var io = server.io;
io.on('connection', function(socket) {
    console.log('a user connected');
    var amqp = require('amqplib/callback_api');
    socket.on('welcome', function(msg) {
        var q = msg.rb;
        var array_notifiche = JSON.parse(msg.array_notifiche);
        var decipher = crypto.createDecipher(ALGORITHM, CRYPTO_PASS_RABBIT);
        var id = decipher.update(q, 'hex', 'utf8');
        id += decipher.final('utf8');
        var FIREBASE_URL = 'https://app-giulia.firebaseio.com/Users/' + id + '.json';
        amqp.connect('amqp://ggd94-app-3139141:8081', function(err, conn) {
            conn.createChannel(function(err, ch) {
                console.log(ch);
                ch.assertQueue(q, {
                    durable: false
                });
                console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
                ch.consume(q, function(msg_text) {
                    socket.emit(q, msg_text.content.toString());
                    array_notifiche.push(msg_text.content.toString());
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
                        var persona = response.body;
                        var requestData = {
                            "Person": {
                                user: persona.Person.user,
                                email: persona.Person.email,
                                image: persona.Person.user,
                                luoghi: persona.Person.luoghi,
                                photos: persona.Person.photos,
                                friends: persona.Person.friends,
                                feed: persona.Person.feed,
                                notifications: array_notifiche,
                                number: persona.Person.number + 1
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
                                console.log('notifica messa');
                            }
                            else {
                                console.log('problema inserimento notifica');
                            }
                        })
                    });
                }, {
                    noAck: true
                });

                setTimeout(function() {
                    conn.close();
                    console.log("[*] Exit to %s", q);
                }, 500);
            });
        });
    });
})

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
    var friends = JSON.parse(req.body.friends);
    var myname = req.body.myname;
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
                                    console.log(friends.length + '' + friends)
                                    amqp.connect('amqp://ggd94-app-3139141:8081', function(err, conn) {
                                        console.log('funziona');
                                        conn.createChannel(function(err, ch) {
                                            for (var i = 0; i < friends.length; i++) {
                                                console.log('entrato nel canale');
                                                console.log(friends[i]);
                                                var cipher = crypto.createCipher(ALGORITHM, CRYPTO_PASS_RABBIT);
                                                var q = cipher.update(friends[i].id, 'utf8', 'hex');
                                                q += cipher.final('hex');
                                                console.log(q);
                                                var msg = myname + ' ha visitato un nuovo luogo';
                                                ch.assertQueue(q, {
                                                    durable: false
                                                });
                                                ch.sendToQueue(q, new Buffer(msg));
                                                console.log(" [x] Sent" + msg);
                                            }
                                        });
                                        setTimeout(function() {
                                            conn.close()
                                        }, 5000);
                                    });

                                    res.redirect("https://app-ggd94.c9users.io/users/FBLogin");
                                }
                                else {
                                    res.send(body);
                                }
                            })
                        }
                    }
                    else {
                        res.send(body);
                    }
                });
            }

        }
        else {
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
            var photo = [],
                feed = [],
                tagged_place = [];
            if (persona.Person.hasOwnProperty('photos')) photo = persona.Person.photos;
            if (persona.Person.hasOwnProperty('feed')) feed = persona.Person.feed;
            if (persona.Person.hasOwnProperty('luoghi')) tagged_place = persona.Person.luoghi;
            res.render('home_friends', {
                name: '' + persona.Person.user,
                email: '' + persona.Person.email,
                image: '' + persona.Person.image,
                luoghi: JSON.stringify(tagged_place),
                photos: JSON.stringify(photo),
                feed: JSON.stringify(feed)
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
    var luogo_it = req.body.place_it;
    var luogo_en = req.body.place_en;
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
                    var place = [];
                    if (response.body.Person.hasOwnProperty('luoghi')) place = response.body.Person.luoghi;
                    console.log(place);
                    for (var l = 0; l < place.length; l++) {
                        if (place[l].hasOwnProperty('place') && place[l].place.hasOwnProperty('location') && place[l].place.location.hasOwnProperty('city') && (place[l].place.location.city.toLowerCase() == luogo_it.toLowerCase() || place[l].place.location.city.toLowerCase() == luogo_en.toLowerCase())) {
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
})


/**************************************LOGIN FACEBOOK*********************************/

/*funzione invocata al click del bottone per login facebook*/
router.get('/FBLogin', function(req, res, next) {
    res.redirect('https://app-ggd94.c9users.io/users/FBLogin/confirm');
});

/*-----------------------------------login tramite facebook chiedendo conferma al client-----------------------------*/


/*************************** LOGIN FACEBOOK ***************************************/

router.get('/FBLogin/confirm', [login.cb0, login.cb1, login.cb2, login.cb3, login.cb4, login.cb5]);
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
