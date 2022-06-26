const express = require('express');                                                        //Import the express dependency
const sessions = require('express-session');
const cors = require('cors');
const path = require('path');                                                              //Import the path dependency
const admin = require("firebase-admin");                                                   //Import Firebase-admin for realtime-database
const serviceAccount = require("./simc-iot-firebase-adminsdk-bopry-589a1f03a8.json");      //Import Firebase-admin api-key
const firebase = require("firebase/app");
const firebaseAuth = require("firebase/auth");
const crypto = require('crypto');                                                           //Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

const PORT = process.env.PORT || 3000;                                                     //Save the port number where your server will be listening

//Start Firebase-admin server
const defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://simc-iot-default-rtdb.firebaseio.com"
});

const db = defaultApp.database();
var databases_map = new Map();                                             // HashMap for storing database apps values


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

const config = firebase.initializeApp(keys);

const session_key = '0f0c9ee8-efb3-4637-89f6-9f3e0490f108';               // Session Key
const oneDay = 1000 * 60 * 60 * 24;                                       // creating 24 hours from milliseconds
var sessions_map = new Map();                                             // HashMap for storing values
const auth = firebaseAuth.getAuth();                                      // Constant for using Firebase Authentincation Functions

//Instantiate an express app, the main work horse of this server
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use(express.json({ limit: '50mb' }));

//Configure Cross-Origin Resource Sharing (CORS)
const corsOptions ={
    //origin: '*',
    origin: 'http://localhost:8000', 
    credentials:true,                     //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

//Configure Session middleware
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

//SETTING UP MIDDLEWARE
function myMiddleware (req, res, next) {
  let url = req._parsedUrl.pathname
  console.log(url+"\n"+req.sessionID)
  let permitedUrls = ["/", "/login", "/check-session","/logout"]
  if(permitedUrls.includes(url)){
    next()
    return
  }
  user = sessions_map.get(req.sessionID)
  if(user == undefined){
    res.send(session_error(150))
    return
  }
  next()
}

app.use(myMiddleware)


/*************************/
/*Finished Server Configs*/
/*************************/


//ERROR HANDLING
const db_success = {"name": "Successful", "code": 200}
function session_error(num){
  return {"name": "SessionError", "code": "A sessão Expirou.", "num":num}
}
function db_error(num){
  return {"name": "FirebaseError", "code": "Internal Server Error", "num": num}
}

//Primary HTTP GET Method

app.get('/', (req, res) => {
  res.send({"result": "Server Online"});
});

/*************************/
/**** SELECT DATABASE ****/
/*************************/

function get_database(database){
  let db_instace = databases_map.get(database)
  if (db_instace == undefined || db_instace == null){
    const new_db = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: database
    }, database);
    databases_map.set(database, new_db)
    return new_db
  }
  return db_instace
}


/*************************/
/*********SESSION*********/
/*************************/


app.get('/check-session', (req, res) => {
  if(sessions_map.has(req.sessionID)){
    res.send(db_success)
    return
  }
  res.send(session_error(150))
});

/*************************/
/******AUTHENTICATION*****/
/*************************/
//ERROR CODES: 102, 103

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const step1 = "User Login"
  const step2 = "Get client from user in `usuarios/${uid_user}/cliente`"
  const step3 = "Get client database in `clientes/${cliente_uid}/database`"
  firebaseAuth.signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    // Signed in
    let uid = userCredential.user.uid
    let ref = db.ref(`usuarios/${uid}/cliente`);

    //Step2
    ref.once('value').then(function (snapshot){
      return snapshot.val()
    })
    //Step3
    .then(function(cliente_uid){
    let ref = db.ref(`clientes/${cliente_uid}/database`);
    ref.once('value').then(function (snapshot){
      return snapshot.val()
    })
    //Step4
    .then(function(firebase_cliente){
      let cliente = {"database":firebase_cliente.database, "uid":firebase_cliente.uid, "nome":firebase_cliente.nome}
      sessions_map.set(req.sessionID, {"uid": uid, "cliente": cliente})
      res.send(db_success)
      })
    }).catch((error)=>{
      //Throw error Step3
      console.log("Error in: " + step3 + "\n" + error + "\n")
      res.send(db_error(103));
    })

  }).catch((error) => {
      if(error.name == "FirebaseError") {
        //Throw error Step 1
        console.log("Error in: " + step1 + "\n" + error + "\n")
        console.log(error.code)
        res.send(error)
        return
      }
      //Throw error Step 2
      console.log("Error in: " + step2 + "\n" + error + "\n")
      res.send(db_error(102));        
  });
});

app.get('/logout', (req, res) => {
  try{
    sessions_map.delete(req.sessionID)
  }catch(error){
    console.log(error)
  }
  res.send("Logout")
});

/*************************/
/******SELECT CLIENT******/
/*************************/


app.get('/set-cliente', (req, res) => {
  console.log("function set Cliente")
  let uid_cliente = req.query.clienteuid;
  let database_cliente = req.query.database;
  let nome_cliente = req.query.nome;
  let cliente = {"database":database_cliente, "uid":uid_cliente, "nome":nome_cliente}
  let user = sessions_map.get(req.sessionID)
  user.database = database_cliente

  const ref = db.ref(`usuarios/${user.uid}`)

  //ref.update({ 'cliente': uid_cliente })
  ref.update({ 'cliente': uid_cliente}).then(function(){
    user.cliente = cliente
    res.status(200).send("successful")
  }).catch(function(error) {
    console.log("Data could not be saved." + error);
    res.status(201).send("failed")
  });
  
  //res.status(200).send("successful")
});

app.get('/clientes', (req, res) => {
  const ref = db.ref('clientes');
  ref.once('value', (snapshot) => {
    res.send(snapshot.val());
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.send(errorObject)
  }); 
});

app.get('/user_cliente', (req, res) => {
  let cliente = sessions_map.get(req.sessionID).cliente
  res.status(200).send( {"cliente_uid": cliente.uid, "cliente_nome": cliente.nome, "code": 200})
});

app.get('/usuarios', (req, res) => {
    const ref = db.ref('usuarios');
    ref.once('value', (snapshot) => {
      res.send(snapshot.val());
    }, (errorObject) => {
      console.log('The read failed: ' + errorObject.name);
      res.send(db_error(200))
    }); 
});

app.get('/usuarios_de_cliente', (req, res) => {
  let cliente_uid = sessions_map.get(req.sessionID).cliente.uid
  const ref = db.ref('usuarios');
  ref.once('value', (snapshot) => {
    let response = []
    let usuarios = snapshot.val()
    Object.entries(usuarios).forEach((child) => {
      if(child[1].cliente == cliente_uid){
        response.push(child[1])
      }
    });
    res.status(200).send(response);
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.send(db_error(200))
  }); 
});

app.get('/acessos', (req, res) => {
  const ref = db.ref('tipos_acesso');
    ref.once('value', (snapshot) => {
      res.send(snapshot.val());
    }, (errorObject) => {
      console.log('The read failed: ' + errorObject.name);
      res.send(db_error(200))
    }); 
});

/*************************/
/******    OBRAS    ******/
/*************************/

app.get('/obras', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('obras');
  ref.once('value', (snapshot) => {
    res.send(snapshot.val());
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.send(db_error(200))
  }); 
});

//server starts listening for any attempts from a client to connect at port: {port}
//https.createServer(options, app).listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });          
app.listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });      