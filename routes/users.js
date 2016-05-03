var express = require('express');
var router = express.Router();
var request = require('request');
var crypto =require('crypto');

/*-----------------------------------------------------------------------------------> INIZIO SEZIONE LOGIN FACEBOOK <---------------------------------------------------------------------------------*/


var APP_ID_FACEBOOK='';
var APP_SECRET_FB='';
var URL_OAUTH='https://graph.facebook.com/v2.6/oauth/access_token';
var URL='https://www.facebook.com/dialog/oauth?client_id='+APP_ID_FACEBOOK+'&redirect_uri=https://application-giulia.rhcloud.com/users/FBLogin/confirm&scope=email,user_location,user_hometown,user_tagged_places,user_photos,user_friends';

/*funzione invocata al click del bottone per login facebook*/
router.get('/FBLogin',function(req,res,next){
    res.redirect('https://application-giulia.rhcloud.com/users/FBLogin/confirm');
});

/*-----------------------------------login tramite facebook chiedendo conferma al client-----------------------------*/
router.get('/FBLogin/confirm',function(req,res,next){
    var USERNAME,ID,EMAIL,PHOTOS=[],IMAGE,FRIENDS,LUOGHI;
    var ACCESS_TOKEN,APPSECRET_PROOF;
    console.log(req.query);
    if(!req.query.hasOwnProperty('code')){
        res.redirect(URL);
    }
    else{
        var code=req.query.code;
        request.get({
            url: URL_OAUTH,
            qs: {
                client_id: APP_ID_FACEBOOK,
                redirect_uri: 'https://application-giulia.rhcloud.com/users/FBLogin/confirm',
                client_secret:APP_SECRET_FB,
                code:code
            }
        },function(error,response,body){
            if(!error && response.statusCode==200){
                var element=JSON.parse(body);
                ACCESS_TOKEN = element.access_token;
                APPSECRET_PROOF=crypto.createHmac('SHA256',APP_SECRET_FB).update(ACCESS_TOKEN).digest('hex');
                request.get({
                    url: 'https://graph.facebook.com/v2.6/me/photos',
                    qs:{
                        fields:"images,place",
                        access_token: ACCESS_TOKEN,
                        appsecret_proof: APPSECRET_PROOF
                    }
                },function(error,response,body){
                    if(!error && response.statusCode==200){
                        var array=JSON.parse(body).data;
                        for(var i=0;i<array.length;i++){
                            if(array[i].hasOwnProperty('place')){
                                PHOTOS.push(array[i]);
                            }
                        }
                    }
                    else{
                        console.log(error);
                    }
                });
                        
                request.get({
                    url: 'https://graph.facebook.com/v2.6/me',
                    qs:{
                        fields:"name,email,picture,tagged_places,friends",
                        access_token: ACCESS_TOKEN,
                        appsecret_proof: APPSECRET_PROOF
                    }
                    },function(error,response,body){
                        if(!error && response.statusCode==200){
                            USERNAME=JSON.parse(body).name;
                            ID=JSON.parse(body).id;
                            EMAIL=JSON.parse(body).email;
                            IMAGE=JSON.parse(body).picture.data.url;
                            LUOGHI=JSON.parse(body).tagged_places.data;
                            FRIENDS=JSON.parse(body).friends.data;
            /************************** SALVO DATI IN FIREBASE ********************************/

                            var FIREBASE_URL='https://application-giulia.firebaseio.com/Users/'+ID+'.json';
                            var requestData= {
                                "Person" : {
                                    user : USERNAME,
                                    email: EMAIL,
                                    image: IMAGE,
                                    luoghi:LUOGHI,
                                    photos: PHOTOS,
                                    friends: FRIENDS
                                }
                            };
                            request.put({
                                url: FIREBASE_URL,
                                json: true,
                                headers: {
                                    "content-type": "application/json"
                                },body: JSON.stringify(requestData)
                            },function(error,response,body){
                                if(!error && response.statusCode==200){
                                    res.render("home",{
                                        name: USERNAME,
                                        email: EMAIL,
                                        photo: IMAGE,
                                        luoghi: JSON.stringify(LUOGHI),
                                        photos: JSON.stringify(PHOTOS),
                                        friends: JSON.stringify(FRIENDS)
                                    });
                                }
                                else{
                                    console.log(error);
                                }
                            });
                                
            /*************************** FINE SALVATAGGIO ***************************************/
                                
                        }
                    else{
                        console.log(error);
                    }
                });
            }
        });
    }
});

/*---------------------------------------------------------------------------------------------FINE LOGIN FACEBOOK------------------------------------------------------------------*/


    

    

router.post('/dataFriends',function(req,res,next){
    var id=req.body.id;
    var url='https://application-giulia.firebaseio.com/Users/'+id+'.json';
    request.get({
        url: url,
        json: true,
        headers: {
            "content-type": "application/json"
        }
        },function(error,response,body){
            if(!error && response.statusCode==200){
                var persona=JSON.parse(response.body);
                res.render('home_friends',{
                    name:''+ persona.Person.user,
                    email:''+persona.Person.email,
                    image:''+persona.Person.image,
                    luoghi:JSON.stringify(persona.Person.luoghi),
                    photos:JSON.stringify(persona.Person.photos)
                });
            }
            else{
                res.json(response.statusCode,{
                    error: error
                });
            }
        });
});
        
        
router.post('/luogoCercato',function(req,res,next){
    var luogo=req.body.place;
    var id=req.body.friend;
    var url='https://application-giulia.firebaseio.com/Users/'+id+'.json';
    request.get({
        url: url,
        json: true,
        headers: {
            "content-type": "application/json"
        }
    },function(error,response,body){
        if(!error && response.statusCode==200){
            var nome=JSON.parse(response.body).Person.user;
            var place=JSON.parse(response.body).Person.luoghi;
            for(var l=0;l<place.length;l++){
                if(place[l].place.location.city.toLowerCase() == luogo.toLowerCase())
                    res.json({name:''+nome});
            }
        }
        else{
            console.log(error);
            res.json({name:''});
        }
    });
});

/*gestione della url di HOMEPAGE una volta loggati*/
router.post('/',function(req,res,next){
    var options = {
        root: __dirname + "/../public/html/",
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
  };
  var fileName = 'home.html';
  res.sendFile(fileName, options, function (err) {
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
