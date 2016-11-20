// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
    
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
app.get('/setup', function(req, res) {

  // create a sample user
  var nick = new User({ 
    name: 'Nick Cerminara', 
    password: 'password',
    admin: true 
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// API ROUTES -------------------
var apiRoutes = express.Router();

apiRoutes.post("/auth", function(req, res){
   User.findOne({name: req.body.name}, function(err, user){
    
    if(err){
      console.log("error");
    } if (!user){
      res.json({success:false, message: "auth failed, usuario no encontrado"})
    } else if(user){


      if(user.password != req.body.password){
        res.json({success:false, message:"contraseña incorrecta"})
      } else {


         var token = jwt.sign(user, app.get("superSecret"), {
              expiresIn : 60*60*24
         });

         res.json({success:true, message: "logeado correctamente", token: token});
      }
    }


   });

});

//Check token

apiRoutes.use(function(req,res,next){
   
var token = req.body.token || req.query.token || req.headers["x-access-token"];

if(token){

  jwt.verify(token, app.get("superSecret"), function(err, decoded){
           if(err){
             res.json({success:false, message:"error"});
           } else {
             req.decoded = decoded;
             next();
           }
  });

} else {

  return res.status(403).send({success:false, message:"token falso"});
}

});

apiRoutes.get("/",function(req,res){

 res.json({message : "Bienvenido al auth de mi api"});
});


apiRoutes.get("/users", function(req, res){
  
   User.find({}, function(err, users){
     if(err){
       console.log("errorr")
     } else {
       res.json(users);
     }
   });

});

app.use("/api", apiRoutes);


// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);