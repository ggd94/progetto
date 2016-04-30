var express = require('express');
var router = express.Router();
var request = require('request');


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

  var fileName = 'welcome.html';
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

router.get('/normativa-privacy',function(req,res,next){
    var options = {
    root: __dirname + "/../public/html",
    //dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = 'normativa-privacy.html';
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
