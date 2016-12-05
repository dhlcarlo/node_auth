// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var cors = require('cors');




var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model


    
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(cors()); 
// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
app.post('/setup', function(req, res) {

  // create a sample user

   var newUser = new User();
    newUser.name = req.body.name;
    newUser.password =req.body.password;
  // save the sample user
  newUser.save(function(err) {
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


          user.comparePassword(req.body.password, function(err, isMatch) {
            if (isMatch && isMatch == true) {
            var token = jwt.sign(user, app.get("superSecret"), {
              expiresIn : 60*60*24

              });

            res.json({success:true, message: "logeado correctamente", token: token});

           } else { 
            res.json({success:false, message: "contraseña incorrecta"});
          }
            
        });    
      
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


apiRoutes.get("/users",function(req, res){
  
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