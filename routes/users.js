var express = require('express');
var router = express.Router();
var request = require('request');

/*gestione della url di HOMEPAGE una volta loggati*/
router.get('/',function(req,res,next){
    var options = {
        root: __dirname + "/../public/html/",
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
  };
  var token=facebook.TOKEN_FB;
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

/*---------------------------------------------------------------- Gestione google Maps -------------------------------------------------------*/








module.exports = router;
