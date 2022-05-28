const express = require('express');                     //Import the express dependency
const path = require('path');                           //Import the path dependency
const PORT = process.env.PORT || 3000;                  //Save the port number where your server will be listening

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
const config = firebase.initializeApp({
  apiKey: "AIzaSyAHcRmpf7I92tzxMsq72pwqK3n5BwB9Klg",
  authDomain: "simc-iot.firebaseapp.com",
  databaseURL: "https://simc-iot-default-rtdb.firebaseio.com",
  projectId: "simc-iot",
  storageBucket: "simc-iot.appspot.com",
  messagingSenderId: "558911081308",
  appId: "1:558911081308:web:114d4ea9adc511a22a4f99",
  measurementId: "G-KBP29SP75M"
});

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
  cookie: { maxAge: oneDay, sameSite: 'none', secure: true},
  resave: false,
}));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode).json(err);
});

app.get('/', (req, res) => {
    res.send({"result": "Server Online"});
    console.log("/")
    console.log(req.sessionID)
});

auth.onAuthStateChanged(user =>{
  console.log("onAuthStateChanged")
  if(user != null){
    console.log(user.email);
    console.log(user.displayName);
    console.log(user.uid)
  }
});

app.get('/login', (req, res) => {
    console.log("login")
    let email = req.query.email;
    let password = req.query.password;
    let session = req.query.session;
    firebaseAuth.signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      let req_session_ID = req.sessionID;
      let user = {username: email, password: password};
      if(!sessions_map.has(req_session_ID)){
        sessions_map.set(req_session_ID, auth);
      }
      res.send(userCredential.user)
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

app.get('/logout', (req, res) => {

  /*firebaseAuth.signOut(auth).then((userCredential) =>{
    console.log("logout");
    console.log(userCredential);
  }).catch((error) => {
    console.log(error);
  })
  res.send(logout)*/
  //console.log(sessions_map);
  console.log(req.session.id)
  res.send("Logout")
});

database = getDatabase(config);

app.get('/clientes', (req, res) => {
  let reference = realtime_database.ref(database);
  //console.log(reference);
  realtime_database.get(realtime_database.child(reference, `clientes`)).then((snapshot) => {
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
https.createServer(options, app).listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });          