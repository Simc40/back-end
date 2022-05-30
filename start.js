const express = require('express');                     //Import the express dependency
const path = require('path');                           //Import the path dependency
const PORT = process.env.PORT || 3000;                  //Save the port number where your server will be listening

var admin = require("firebase-admin");
var serviceAccount = require("./simc-iot-firebase-adminsdk-bopry-589a1f03a8.json");

var defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://simc-iot-default-rtdb.firebaseio.com"
});

const db = defaultApp.database();


var firebase = require("firebase/app");
const realtime_database = require("firebase/database")
const firebaseAuth = require("firebase/auth");
var database;

const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

//Crypto for generatin Random UUIDs
const crypto = require('crypto');
//const uuid = crypto.randomUUID();


// Initialize Firebase Configurations

const keys = {
  apiKey: "AIzaSyAHcRmpf7I92tzxMsq72pwqK3n5BwB9Klg",
  authDomain: "simc-iot.firebaseapp.com",
  databaseURL: "https://simc-iot-default-rtdb.firebaseio.com",
  projectId: "simc-iot",
  storageBucket: "simc-iot.appspot.com",
  messagingSenderId: "558911081308",
  appId: "1:558911081308:web:114d4ea9adc511a22a4f99",
  measurementId: "G-KBP29SP75M"
}

let config = firebase.initializeApp(keys);

const session_key = '0f0c9ee8-efb3-4637-89f6-9f3e0490f108'; // Session Key
const oneDay = 1000 * 60 * 60 * 24;                         // creating 24 hours from milliseconds
let sessions_map = new Map();                               // HashMap for storing values
var auth = firebaseAuth.getAuth();                          // Constant for using Firebase Authentincation Functions

let app = express();                                        //Instantiate an express app, the main work horse of this server
app.use(express.static(path.join(__dirname, 'public')));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use(express.json({ limit: '50mb' }));

const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const cors = require('cors');
const { getDatabase, ref, onValue } = require('firebase/database');
const { response } = require('express');
const corsOptions ={
    origin:'http://localhost:8000', 
    credentials:true,                     //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));


//session middleware
app.use(sessions({
  name: "back_end",
  secret: session_key,
  saveUninitialized:true,
  cookie: { maxAge: oneDay, sameSite: 'strict', secure: false},
  resave: false,
}));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode).json(err);
});

app.get('/', (req, res) => {
    console.log("/")
    console.log(req.sessionID)
    res.send({"result": "Server Online"});
});


app.get('/loginstate', (req, res) => {
  console.log(req.sessionID)
  res.send("loginstate")
});

app.get('/login', (req, res) => {
    let email = req.query.email;
    let password = req.query.password;
    console.log("login")
    console.log(req.sessionID)
    firebaseAuth.signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      let uid = userCredential.user.uid
      let ref = db.ref(`usuarios/${uid}/cliente`);

      ref.once('value').then(function (snapshot){
        return snapshot.val()
      }, (errorObject) => {
        res.send('The read failed: ' + errorObject.name);
      }).then(function(cliente_uid){

        let ref = db.ref(`clientes/${cliente_uid}/database`);
        ref.once('value').then(function (snapshot){
          return snapshot.val()
        }, (errorObject) => {
          res.send('The read failed: ' + errorObject.name);
        }).then(function(database_cliente){
          save_session(req.sessionID, {"uid": uid, "database":database_cliente})
          res.send(userCredential.user)
        })

      })
    })
    .catch((error) => {
        console.log("Firebase Login Error:")
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode)
        console.log(errorMessage)
        res.send(error)
    });
});

function save_session(sessionID, user){
  if(!sessions_map.has(sessionID)){
    sessions_map.set(sessionID, user);
  }
}

app.get('/set-cliente', (req, res) => {
  console.log("set-cliente")
  let uid_cliente = req.query.clienteuid;
  let database_cliente = req.query.database;
  let user_uid = get_user_session_uid(req.sessionID)
  if(user_uid == undefined || uid_cliente == undefined){
    res.send("error")
    return
  }
  const ref = db.ref(`usuarios/${user_uid}`);
  ref.update({
    'cliente': uid_cliente
  }, (error =>{
    if(error){
      res.send("error")
    }else{
      sessions_map.set(req.sessionID, {"uid": user_uid, "database":database_cliente})
      res.send("successful")
    }
  }))
});

function get_user_session_uid(sessionID){
  if(!sessions_map.has(sessionID)){
    return undefined
  }else{
    return(sessions_map.get(sessionID).uid)
  }
}



app.get('/check-session', (req, res) => {
  console.log("check-session")
  console.log(req.sessionID)
  if(!sessions_map.has(req.sessionID)){
    res.send("not logged")
  }else{
    res.send("logged")
  }
});

app.get('/logout', (req, res) => {
  sessions_map.delete(req.sessionID)
  res.send("Logout")
});

//database = getDatabase(config);

app.get('/clientes', (req, res) => {
    const ref = db.ref('clientes');
    ref.on('value', (snapshot) => {
      res.send(snapshot.val());
    }, (errorObject) => {
      console.log('The read failed: ' + errorObject.name);
    }); 
});



/*const ref = db.ref('clientes');
ref.on('value', function(snapshot){
  snapshot.forEach(function(child_snapshot){
    var key = child_snapshot.key
    var value = child_snapshot.val()
    console.log(key,value)
  })
}, (errorObject) => {
  console.log('The read failed: ' + errorObject.name);
});*/

app.get('/usuarios', (req, res) => {
    const ref = db.ref('usuarios');
    ref.on('value', (snapshot) => {
      res.send(snapshot.val());
    }, (errorObject) => {
      console.log('The read failed: ' + errorObject.name);
    }); 
});

app.get('/acessos', (req, res) => {
  const ref = db.ref('tipos_acesso');
    ref.on('value', (snapshot) => {
      res.send(snapshot.val());
    }, (errorObject) => {
      console.log('The read failed: ' + errorObject.name);
    }); 
});

app.get('/obras', (req, res) => {
  let reference = realtime_database.ref(database, "")
  //console.log(reference);
  realtime_database.get(realtime_database.child(reference, `obras`)).then((snapshot) => {
    if (snapshot.exists()) {
      res.send(snapshot.val())
    }else{
      console.log("O dado referido não existe")
    }
  }).catch((error) => {
    console.error(error);
  });
});

//server starts listening for any attempts from a client to connect at port: {port}
//https.createServer(options, app).listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });          
app.listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });      