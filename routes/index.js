var express = require('express');
var router = express.Router();
var request = require('request');
var fs= require('fs'); //to read file html


/* GET home page --> login da effettuare*/
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  var options = {
    root: __dirname + "/../public/html",
    //dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = 'FBlogin.html';
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
/*--------------------------------------------------------------------> INIZIO SEZIONE ISCRIZIONE <--------------------------------------------------------------*/

var POSTMARK_TOKEN='';
var EMAIL='';
var html=fs.readFileSync(__dirname+"/../public/html/postmark.html","utf-8");

/*url per la gestione della form utile all'iscrizione*/
router.get('/signup',function(req,res,next){
    var options = {
    root: __dirname + "/../public/html",
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = 'login.html';
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


/*Invio della form con iscrizione via email attraverso postmark*/
router.post('/signup/confirm', function(req, res, next) {
    var url='https://api.postmarkapp.com/email';
    var headers={
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_TOKEN+''
    };
    var body={
        'From': EMAIL+'',
        'To': req.body.email,
        'Subject': 'Welcome to Bookstore',
        'Htmlbody': html
      };
    request.post({
        url:url,
        headers:headers,
        body:JSON.stringify(body)
    },function(error,response,body){
        if (!error && response.statusCode == 200) {
            response.send(body);
        }
        else{
            response.send(error.status);
        }
    });
    res.send("Conferma la registrazione accedendo alla mail");
    
});

/*reindirizzamento del link a cui si accede dall'email ricevuta da postmark*/
router.get('/signup/confirm/success',function(req,res,next){
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

/*-----------------------------------------------------------------------------------> FINE SEZIONE DI ISCRIZIONE <------------------------------------------------------------------------------------*/


/*-----------------------------------------------------------------------------------> INIZIO SEZIONE LOGIN FACEBOOK <---------------------------------------------------------------------------------*/


var APP_ID_FACEBOOK='';
var APP_SECRET_FB='';
var URL_OAUTH='https://graph.facebook.com/v2.3/oauth/access_token?';
var URL='https://www.facebook.com/dialog/oauth?client_id='+APP_ID_FACEBOOK+'&redirect_uri=https://application-giulia.rhcloud.com/FBLogin/confirm';
var access_token;
/*funzione invocata al click del bottone per login facebook*/
router.get('/FBLogin',function(req,res,next){
    res.redirect(URL);
});

/*login tramite facebook chiedendo conferma al client*/
router.get('/FBLogin/confirm',function(req,res,next){
    var code=req.query.code;
    request.get({
        url: URL_OAUTH,
        qs: {
            client_id: APP_ID_FACEBOOK,
            redirect_uri: 'https://application-giulia.rhcloud.com/FBLogin/confirm',
            client_secret:APP_SECRET_FB,
            code:code
        }
    },function(error,response,body){
        if(!error && response.statusCode==200){
            access_token = body.access_token;
            exports.TOKEN_FB=access_token;
            res.redirect('https://application-giulia.rhcloud.com/users');
        }
        else{
            console.log(error);
        }

    });
});

module.exports = router;
