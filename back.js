const express = require('express');                                                        //Import the express dependency
const fileUpload = require('express-fileupload');
const fs = require('fs')
const sessions = require('express-session');
const cors = require('cors');
const path = require('path');                                                              //Import the path dependency
const admin = require("firebase-admin");                                                   //Import Firebase-admin for realtime-database
const { getStorage } = require('firebase-admin/storage');
const ba64 = require("ba64")
const serviceAccount = require("./simc-iot-firebase-adminsdk-bopry-589a1f03a8.json");      //Import Firebase-admin api-key
const firebase = require("firebase/app");
const firebaseAuth = require("firebase/auth");
const crypto = require('crypto');                                                           //Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

const PORT = process.env.PORT || 3000;                                                     //Save the port number where your server will be listening


const JSON_new_client = require('./simc-iot-new-cliente.json')

//Start Firebase-admin server
const defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://simc-iot-default-rtdb.firebaseio.com",
  storageBucket: "simc-iot.appspot.com"
});

const dbucket = defaultApp.storage().bucket();
const db = defaultApp.database();
let databases_map = new Map();                                             // HashMap for storing database apps values

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
let sessions_map = new Map();                                             // HashMap for storing values
const auth = firebaseAuth.getAuth();                                      // Constant for using Firebase Authentincation Functions

//Instantiate an express app, the main work horse of this server
let app = express();
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

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.statusCode).json(err);
});

//SETTING UP MIDDLEWARE
function myMiddleware (req, res, next) {
  let url = req._parsedUrl.pathname
  console.log(url+"\n"+req.sessionID)
  let permitedUrls = ["/", "/login", "/check-session","/logout", "/forget_password"]
  if(permitedUrls.includes(url)){
    next()
    return
  }
  let user = sessions_map.get(req.sessionID)
  if(user == undefined){
    res.status(404).send()
    return
  }
  next()
}

app.use(myMiddleware)


/*************************/
/*Finished Server Configs*/
/*************************/

//Primary HTTP GET Method

app.get('/', (_req, res) => {
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
/******** Acessos ********/
/*************************/

let acessos = {
  "responsavel": "49481bb2-4aa9-4266-ba2b-3d2faa6258a0",
  "usuario": "497ed826-c29f-4dc3-964b-d491f54a2a2f",
  "admin": "685fe674-9d61-4946-8435-9cbc23a1fc8a"
}

let acessos_from_uid = {
  "49481bb2-4aa9-4266-ba2b-3d2faa6258a0": "responsavel",
  "497ed826-c29f-4dc3-964b-d491f54a2a2f": "usuario",
  "685fe674-9d61-4946-8435-9cbc23a1fc8a": "admin"
}

/*************************/
/*********SESSION*********/
/*************************/


app.get('/check-session', (req, res) => {
  if(sessions_map.has(req.sessionID)){
    let success = {}
    success.user_name = sessions_map.get(req.sessionID).nome
    success.imgUrl = sessions_map.get(req.sessionID).imgUrl
    success.acesso = Object.keys(acessos).find(key => acessos[key] === sessions_map.get(req.sessionID).acesso);
    success.cliente = sessions_map.get(req.sessionID).cliente.nome
    success.logoUrl = sessions_map.get(req.sessionID).cliente.logo
    res.status(200).send(success)
    return
  }
  res.status(404).send()
});

/*************************/
/******AUTHENTICATION*****/
/*************************/

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  firebaseAuth.signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    // Signed in
    let uid = userCredential.user.uid
    let ref = db.ref(`usuarios/${uid}`);
    let user_name
    let user_acesso
    let user_imgUrl
    //Step2
    ref.once('value').then(function (snapshot){
      return snapshot.val()
    })
    //Step3
    .then(function(user){
    let cliente_uid = user.cliente
    user_name = user.nome
    user_acesso = user.acesso
    user_imgUrl = user.imgUrl
    ref = db.ref(`clientes/${cliente_uid}`);
    ref.once('value').then(function (snapshot){
      return snapshot.val()
    })
    //Step4
    .then(function(firebase_cliente){
      let cliente = {"storage": firebase_cliente.storage, "database":firebase_cliente.database, "uid":firebase_cliente.uid, "nome":firebase_cliente.nome, "logo": firebase_cliente.logoUrl}
      sessions_map.set(req.sessionID, {"acesso": user_acesso, "uid": uid, "cliente": cliente, "nome": user_name, "imgUrl": user_imgUrl})
      if(user_acesso == acessos.admin){
        res.status(202).send()
      }else{
        if(user_acesso == acessos.responsavel){
          res.status(200).send();
          return
        }
        let ref_permission = db.ref(`usuarios/${uid}/acessos_atividades/Website`);
        ref_permission.once('value', (snapshot) => {
          if(snapshot.val() == "ativo") res.status(200).send();
          else if(snapshot.val() == "inativo") res.status(403).send();
          else{res.status(500).send()}
        }, (errorObject) => {
          console.log('The read failed: ' + errorObject.name);
          res.status(500).send()
        }); 
      }
      })
    }).catch((error)=>{
      //Error in Get client database in `clientes/${cliente_uid}/database`
      console.log(error)
      res.status(507).send()
    })

  }).catch((error) => {
      console.log(error)
      if(error.name == "FirebaseError") {
        //User Login error
        res.status(401).send()
        return
      }
      //Error in Get client from user in `usuarios/${uid_user}/cliente`
      res.status(507).send()
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
/****** USER INFO   ******/
/*************************/

app.get('/cliente_de_usuario', (req, res) => {
  try{
    let cliente = sessions_map.get(req.sessionID).cliente
    let acesso = undefined
    if (sessions_map.get(req.sessionID).acesso == acessos.admin) acesso = "admin"
    else if (sessions_map.get(req.sessionID).acesso == acessos.responsavel) acesso = "responsavel"
    else if (sessions_map.get(req.sessionID).acesso == acessos.usuario) acesso = "usuario"
    res.status(200).send({"cliente_uid": cliente.uid, "cliente_nome": cliente.nome, "user_acesso": acesso})
  }catch{
    res.status(507).send()
  }
});

app.get('/usuarios_de_cliente', (req, res) => {
  let cliente_uid = sessions_map.get(req.sessionID).cliente.uid
  const ref = db.ref('usuarios');
  ref.once('value', (snapshot) => {
    let response = {}
    let usuarios = snapshot.val()
    Object.entries(usuarios).forEach((child) => {
      if(child[1].cliente == cliente_uid && child[1].acesso != "685fe674-9d61-4946-8435-9cbc23a1fc8a"){
        response[child[0]] = child[1]
      }
    });
    if(Object.keys(response).length === 0) res.status(404).send()
    else{res.status(200).send(response)}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.get('/nome_de_usuarios_de_cliente', (req, res) => {
  let cliente_uid = sessions_map.get(req.sessionID).cliente.uid
  const ref = db.ref('usuarios');
  ref.once('value', (snapshot) => {
    let response = {}
    let usuarios = snapshot.val()
    Object.entries(usuarios).forEach((child) => {
      if(child[1].cliente == cliente_uid || child[1].acesso == "685fe674-9d61-4946-8435-9cbc23a1fc8a"){
        response[child[0]] = child[1].nome
      }
    });
    if(Object.keys(response).length === 0) res.status(404).send()
    else{res.status(200).send(response)}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.get('/profile', (req, res) => {
  let user_uid
  let user_acesso
  let cliente
  try{
    user_uid = sessions_map.get(req.sessionID).uid
    user_acesso = acessos_from_uid[sessions_map.get(req.sessionID).acesso]
    cliente = sessions_map.get(req.sessionID).cliente.nome
  }catch{
    res.status(507).send()
    return
  }

  const ref = db.ref(`usuarios/${user_uid}`);
  ref.once('value', (snapshot) => {
    let response = snapshot.val()
    if(snapshot.val() == null){
      res.status(507).send()
      return
    } 
    response.acesso = user_acesso
    response.cliente = cliente
    res.status(200).send(response);
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

/*************************/
/******SELECT CLIENT******/
/*************************/


app.post('/set-cliente', (req, res) => {
  if(sessions_map.get(req.sessionID).acesso != acessos.admin){
    res.status(403).send();
    return
  }
  console.log("function set Cliente")
  let uid_cliente = req.body.clienteuid;
  let database_cliente = req.body.database;
  let nome_cliente = req.body.nome;
  let storage_cliente = req.body.storage;
  let logo_url = req.body.logo_url;
  let cliente = {"database":database_cliente, "uid":uid_cliente, "nome":nome_cliente, "storage": storage_cliente, "logo": logo_url}
  let user = sessions_map.get(req.sessionID)
  user.database = database_cliente

  const ref = db.ref(`usuarios/${user.uid}`)

  ref.update({ 'cliente': uid_cliente}).then(function(){
    user.cliente = cliente
    res.status(200).send()
  }).catch(function(error) {
    console.log("Data could not be saved." + error);
    res.status(507).send()
  });
  
});

app.get('/clientes', (req, res) => {
  if(sessions_map.get(req.sessionID).acesso != acessos.admin){
    res.status(403).send();
    return
  }
  const ref = db.ref('clientes');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/page_permission', (req, res) => {
  if(sessions_map.get(req.sessionID).acesso != acessos.usuario){
    res.status(200).send();
    return
  }
  let user_uid = sessions_map.get(req.sessionID).uid
  let atividade  = req.body.atividade
  const ref = db.ref(`usuarios/${user_uid}/acessos_atividades/${atividade}`);
  ref.once('value', (snapshot) => {
    if(snapshot.val() == "ativo") res.status(200).send();
    else if(snapshot.val() == "inativo") res.status(403).send();
    else{res.status(500).send()}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(500).send()
  }); 
});

app.get('/acessos', (_req, res) => {
  const ref = db.ref('tipos_acesso');
    ref.once('value', (snapshot) => {
      res.status(200).send(snapshot.val());
    }, (errorObject) => {
      console.log('The read failed: ' + errorObject.name);
      res.status(507).send();
    }); 
});

/*************************/
/****    CLIENTES    *****/
/*************************/

app.post('/clientes_cadastrar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  if(sessions_map.get(req.sessionID).acesso != acessos.admin){
    res.status(403).send();
    return
  }
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    const new_bucket = defaultApp.storage().bucket(child[1].storage);
    let date = child[1].date
    delete child[1].date
    child[1].uid = uuid
    if(!(child[1].image == undefined || child[1].image == null)){
      let extension = convertBase64ToFile(child[1].image)
      const filePath = "image." + extension;
      const bucketName = new_bucket.name;
      const destFileName = "logo/"+filePath;

      async function uploadFile() {
        await new_bucket.upload(filePath, {
          destination: destFileName,
          metadata: {      
            // "custom" metadata:
            metadata: {
              firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
            },
          }
        })
        delete child[1].image
        child[1].logoUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
        let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
        let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
        
        const new_db = get_database(child[1].database)
        let ref = admin.database(new_db).ref();
        ref.update(JSON_new_client).then(function(){
          void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(507).send()
        });
  
        ref = db.ref(`clientes/${uuid}`);
        ref.update(params).then(function(){
            void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(507).send()
        });
      }
      uploadFile().catch(console.error);
    }
    else{
      let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
      let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
      
      const new_db = get_database(child[1].database)
      let ref = admin.database(new_db).ref();
      ref.update(JSON_new_client).then(function(){
        void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(507).send()
      });

      ref = db.ref(`clientes/${uuid}`);
      ref.update(params).then(function(){
          void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(507).send()
      });
    }
  });
  res.status(200).send()
});

app.post('/clientes_gerenciar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  if(sessions_map.get(req.sessionID).acesso != acessos.admin){
    res.status(403).send();
    return
  }
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    delete child[1].date
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let params = child[1]
    let ref = db.ref(`clientes/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
    ref = db.ref(`clientes/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
  });
  res.status(200).send()
});

/*************************/
/*****    ACESSOS    *****/
/*************************/

app.post('/acessos_cadastrar', (req, res) => {
  const user_uid = sessions_map.get(req.sessionID).uid
  if(sessions_map.get(req.sessionID).acesso == acessos.usuario){
    res.status(403).send();
    return
  }
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  let uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    
    let date = child[1].date
    delete child[1].date

    firebaseAuth.createUserWithEmailAndPassword(auth, child[1].email, "newaccountsimc99")
    .then((userCredential) => {
      uuid = userCredential.user.uid
      firebaseAuth.sendPasswordResetEmail(auth, child[1].email, null)
      .then(function() {
        if(child[1].image != null && child[1].image != undefined && child[1].image != ""){
          uploadFile().catch(console.error);
        }else{
          let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
          let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
          let ref = db.ref(`usuarios/${uuid}`);
          ref.update(params).then(function(){
              res.status(200).send()
          }).catch(function(error) {
            console.log(error)
            res.status(507).send()
          });
        }
      })
      .catch(function(error) {
        // Error occurred. Inspect error.code.
        console.log(error)
        res.status(507).send()
      });
    })
    .catch((error) => {
      console.log(error)
      res.status(401).send()
    });
    
    async function uploadFile() {
      let extension = convertBase64ToFile(child[1].image)
      let filePath = "image." + extension;
      let destFileName = "profiles/"+uuid+"/"+filePath;
      delete child[1].image
      const bucketName = new_bucket.name;
      await new_bucket.upload(filePath, {
        destination: destFileName,
        metadata: {      
          // "custom" metadata:
          metadata: {
            firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
          },
        }
      })
      child[1].imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
      console.log(`${filePath} uploaded to ${bucketName}`);
      let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
      let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
      let ref = db.ref(`usuarios/${uuid}`);
      ref.update(params).then(function(){
          res.status(200).send()
      }).catch(function(error) {
        console.log(error)
        res.status(507).send()
      });
    }
  });
});

app.post('/acessos_gerenciar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    delete child[1].date
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}

    let ref = db.ref(`usuarios/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
    ref = db.ref(`usuarios/${uid}`);
    ref.update(child[1]).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
  });
  res.status(200).send()
})

/*************************/
/******    OBRAS    ******/
/*************************/

app.get('/obras', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('obras');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/obras_cadastrar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    let date = child[1].date
    delete child[1].date
    let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
    let ref = admin.database(new_db).ref(`obras/${uuid}`);
    ref.update(params).then(function(){
      res.status(200).send()
    }).catch(function(error) {
      console.og(error)
      res.status(507).send()
    });
  });
});

app.post('/obras_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    delete child[1].date
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date}, child[1])
    console.log(params)
    let ref = admin.database(new_db).ref(`obras/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
    ref = admin.database(new_db).ref(`obras/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
  });
  res.status(200).send()
});

/*************************/
/******    PEÇAS    ******/
/*************************/

app.get('/tipos_de_peca', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('tipos_peca');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/tipos_de_peca_cadastrar', (req, res) => {
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  let user_uid = sessions_map.get(req.sessionID).uid
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    let date = child[1].date
    delete child[1].date
    let extension = convertBase64ToFile(child[1].image)
    const filePath = "image." + extension;
    delete child[1].image
    const bucketName = new_bucket.name;
    const destFileName = "tipos_peca/"+uuid+"/"+filePath;

    async function uploadFile() {
      await new_bucket.upload(filePath, {
        destination: destFileName,
        metadata: {      
          // "custom" metadata:
          metadata: {
            firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
          },
        }
      })
      child[1].imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
      console.log(`${filePath} uploaded to ${bucketName}`);
      let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
      let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
      let ref = admin.database(new_db).ref(`tipos_peca/${uuid}`);
      ref.update(params).then(function(){
          res.status(200).send()
      }).catch(function(error) {
        console.log(error)
        res.status(507).send()
      });
    }
    
    uploadFile().catch(console.error);

  });
});

app.post('/tipos_de_peca_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let status = child[1].status
    let date = child[1].date
    let name = child[1].nome_galpao
    const history_uuid = crypto.randomUUID()
    let params = {}
    if(name == undefined || name == null){
      params = {"lastModifiedBy":user_uid, "lastModifiedOn":date, "status":status}
    }else{
      params = {"lastModifiedBy":user_uid, "lastModifiedOn":date, "status":status, "nome_galpao": name}
    }
    console.log(params)
    let history = {[history_uuid]: params}
    let ref = admin.database(new_db).ref(`tipos_peca/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
    ref = admin.database(new_db).ref(`tipos_peca/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
  });
  res.status(200).send()
});

app.post('/tipos_de_peca_editar', (req, res) => {
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  let history
  let ref
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    let name = child[1].nome_tipo_peca
    const history_uuid = crypto.randomUUID()
    let params = {}
    params = {"lastModifiedBy":user_uid, "lastModifiedOn":date}
    if(!(name == undefined || name == null)){
      params["nome_tipo_peca"] = name
    }
    if(!(child[1].image == undefined || child[1].image == null)){
      let extension = convertBase64ToFile(child[1].image)
      const filePath = "image." + extension;
      const bucketName = new_bucket.name;
      const destFileName = "tipos_peca/"+uid+"/"+filePath;

      async function uploadFile() {
        await new_bucket.upload(filePath, {
          destination: destFileName,
          metadata: {      
            // "custom" metadata:
            metadata: {
              firebaseStorageDownloadTokens: uid, // Can technically be anything you want
            },
          }
        })
        params["imgUrl"] = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uid
        console.log(`${filePath} uploaded to ${bucketName}`);
        history = {[history_uuid]: params}
        ref = admin.database(new_db).ref(`tipos_peca/${uid}/history`);
        ref.update(history).then(function(){
          void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(200).send()
        });
        ref = admin.database(new_db).ref(`tipos_peca/${uid}`);
        ref.update(params).then(function(){
          void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(200).send()
        });
      }
      uploadFile().catch(console.error);
    }
    else{
      ref = admin.database(new_db).ref(`tipos_peca/${uid}/history`);
      history = {[history_uuid]: params}
      ref.update(history).then(function(){
        void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(200).send()
      });
      ref = admin.database(new_db).ref(`tipos_peca/${uid}`);
      ref.update(params).then(function(){
        void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(200).send()
      });
    }
  });
  res.status(200).send()
});

/*************************/
/**** TRANSPORTADORAS ****/
/*************************/

app.get('/transportadoras', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('transportadoras');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/transportadoras_cadastrar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    let date = child[1].date
    delete child[1].date
    let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
    let ref = admin.database(new_db).ref(`transportadoras/${uuid}`);
    ref.update(params).then(function(){
        res.status(200).send()
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
});

app.post('/transportadoras_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    delete child[1].date
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date}, child[1])
    console.log(params)
    let ref = admin.database(new_db).ref(`transportadoras/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
    ref = admin.database(new_db).ref(`transportadoras/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
  res.status(200).send()
});

app.post('/transportadoras_veiculos_cadastrar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    let uid_transportadora = child[0]
    let date = child[1].date
    delete child[1].date
    let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
    let ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/veiculos/${uuid}`);
    ref.update(params).then(function(){
        res.status(200).send()
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
});

app.post('/transportadoras_veiculos_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    delete child[1].date
    let uid_transportadora = child[1].uid_transportadora
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date}, child[1])
    console.log(params)
    let ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/veiculos/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
    ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/veiculos/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
  res.status(200).send()
});


app.post('/transportadoras_motoristas_cadastrar', (req, res) => {
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  let history
  let ref
  Object.entries(req.body.params).forEach((child) => {
    let uid_transportadora = child[0]
    let date = child[1].date
    delete child[1].date
    if(!(child[1].image == undefined || child[1].image == null)){
      let extension = convertBase64ToFile(child[1].image)
      const filePath = "image." + extension;
      const bucketName = new_bucket.name;
      const destFileName = "motoristas/"+uid_transportadora+"/"+uuid+"/"+filePath;

      async function uploadFile() {
        await new_bucket.upload(filePath, {
          destination: destFileName,
          metadata: {      
            // "custom" metadata:
            metadata: {
              firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
            },
          }
        })
        delete child[1].image
        child[1].imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
        history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
        let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
        ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}`);
        ref.update(params).then(function(){
          void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(200).send()
        });
      }
      uploadFile().catch(console.error);
    }
    else{
      history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
      let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
      ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}`);
      ref.update(params).then(function(){
        void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(200).send()
      });
    }
  });
  res.status(200).send()
});

app.post('/transportadoras_motoristas_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    delete child[1].date
    let uid_transportadora = child[1].uid_transportadora
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let params = child[1]
    console.log(params)
    let ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
    ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
  res.status(200).send()
});

app.post('/transportadoras_motoristas_editar', (req, res) => {
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid

  const history_uuid = crypto.randomUUID()
  let history
  let ref
  Object.entries(req.body.params).forEach((child) => {
    const uuid = child[0]
    const uid_transportadora = child[1].uid_transportadora
    let date = child[1].date
    delete child[1].date
    if(!(child[1].image == undefined || child[1].image == null)){
      let extension = convertBase64ToFile(child[1].image)
      const filePath = "image." + extension;
      const bucketName = new_bucket.name;
      const destFileName = "motoristas/"+uid_transportadora+"/"+uuid+"/"+filePath;

      async function uploadFile() {
        await new_bucket.upload(filePath, {
          destination: destFileName,
          metadata: {      
            // "custom" metadata:
            metadata: {
              firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
            },
          }
        })
        child[1].imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
        history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
        let params = child[1]
        ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}/history`);
        ref.update(history).then(function(){
          void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(200).send()
        });
        ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}`);
        ref.update(params).then(function(){
          void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(200).send()
        });
      }
      uploadFile().catch(console.error);
    }
    else{
      history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
      let params = child[1]
      ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}/history/${history_uuid}`);
      ref.update(history).then(function(){
        void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(200).send()
      });
      ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}`);
      ref.update(params).then(function(){
        void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(200).send()
      });
    }
  });
  res.status(200).send()
});


/*************************/
/******   GALPÕES   ******/
/*************************/

app.get('/galpoes', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('galpoes');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/galpoes_cadastrar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    let date = child[1].date
    delete child[1].date
    console.log(child[1])
    let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
    let ref = admin.database(new_db).ref(`galpoes/${uuid}`);
    ref.update(params).then(function(){
        res.status(200).send()
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
});

app.post('/galpoes_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let status = child[1].status
    let date = child[1].date
    let name = child[1].nome_galpao
    const history_uuid = crypto.randomUUID()
    let params = {}
    if(name == undefined || name == null){
      params = {"lastModifiedBy":user_uid, "lastModifiedOn":date, "status":status}
    }else{
      params = {"lastModifiedBy":user_uid, "lastModifiedOn":date, "status":status, "nome_galpao": name}
    }
    console.log(params)
    let history = {[history_uuid]: params}
    let ref = admin.database(new_db).ref(`galpoes/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
    ref = admin.database(new_db).ref(`galpoes/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
  res.status(200).send()
});

/*************************/
/******    FORMAS   ******/
/*************************/

app.get('/formas', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('formas');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});
app.post('/formas_cadastrar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    let date = child[1].date
    delete child[1].date
    let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
    let ref = admin.database(new_db).ref(`formas/${uuid}`);
    ref.update(params).then(function(){
        res.status(200).send()
    }).catch(function(error) {
        console.log(error)
        res.status(507).send()
    });
  });
});

app.post('/formas_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let date = child[1].date
    delete child[1].date
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date}, child[1])
    console.log(params)
    let ref = admin.database(new_db).ref(`formas/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
    ref = admin.database(new_db).ref(`formas/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
  });
  res.status(200).send()
});


/*************************/
/*****    elementos   ******/
/*************************/

app.get('/elementos', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('elementos');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/elementos_cadastrar', (req, res) => {
  let user_uid = sessions_map.get(req.sessionID).uid
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  Object.entries(req.body.params).forEach((child) => {
    let obra = child[0]
    let date = child[1].date
    delete child[1].date
    delete child[1].obra
    child[1].numPecas = "0"
    child[1].numPlanejado = "0"
    let history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
    let ref = admin.database(new_db).ref(`elementos/${obra}/${uuid}`);
    ref.update(params).then(function(){
        res.status(200).send()
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
});

app.post('/elementos_gerenciar', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let uid = child[0]
    let obra = child[1].obra
    let date = child[1].date
    delete child[1].date
    delete child[1].obra
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let params = Object.assign({}, {"createdBy":user_uid, "creation":date}, child[1])
    console.log(params)
    let ref = admin.database(new_db).ref(`elementos/${obra}/${uid}/history`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
    ref = admin.database(new_db).ref(`elementos/${obra}/${uid}`);
    ref.update(params).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
  });
  res.status(200).send()
});

/*************************/
/****    CheckList   *****/
/*************************/

app.get('/checklist', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('checklist');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/checklist_post', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    let etapa = child[0]
    let date = child[1].date
    delete child[1].date
    const history_uuid = crypto.randomUUID()
    let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])}
    let ref = admin.database(new_db).ref(`checklist/history/${etapa}`);
    ref.update(history).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
    ref = admin.database(new_db).ref(`checklist/${etapa}`);
    ref.set(history_uuid).then(function(){
      void(0)
    }).catch(function(error) {
      console.log(error)
      res.status(507).send()
    });
  });
  res.status(200).send()
});

/*************************/
/*******    PDFs   *******/
/*************************/

app.get('/PDF', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('PDF');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.get('/PDF_elementos', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref('PDF_elementos');
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/PDF_obras', fileUpload(), function (req, res) {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  let user_uid = sessions_map.get(req.sessionID).uid
  const form_size = parseInt(req.body.formData_size)
  let obra = req.body.formData_obra
  let date = req.body.formData_date
  for(let i = 1 ; i <= form_size; i++){
    let params = JSON.parse(req.body[`formData_${i}`])
    const history_uuid = crypto.randomUUID()
    if(params.activity == "remove"){
      let ref = admin.database(new_db).ref(`PDF/${obra}/${params.uid}`);
      ref.remove().then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      new_bucket.file("PDF/"+obra+"/"+params.uid+"/some.pdf").delete();
      continue
    }
    if(params.activity == "status"){
      delete params.activity
      let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, params)}
      let ref = admin.database(new_db).ref(`PDF/${obra}/${params.uid}/history`);
      ref.update(history).then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      ref = admin.database(new_db).ref(`PDF/${obra}/${params.uid}`);
      ref.update(params).then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      if(params.status == "ativo"){
        ref = admin.database(new_db).ref(`PDF/${obra}/ativo`);
        ref.set(params.uid).then(function(){
          void(0)
        }).catch(function(error){
          console.log(error)
          res.status(507).send()
        });
      }
      continue
    }
    delete params.activity
    const uuid = crypto.randomUUID()
    const filePath = "some.pdf"
    let pdf = req.files[`uploadedFile_${i}`]
    console.log(pdf)
    generatePdfFromBuffer(pdf.data)
    const bucketName = new_bucket.name;
    const destFileName = "PDF/"+obra+"/"+uuid+"/"+filePath;

    async function uploadFile() {
      await new_bucket.upload(filePath, {
        destination: destFileName,
        metadata: {      
          // "custom" metadata:
          metadata: {
            firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
          },
        }
      })
      params.pdfUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
      history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, params)
      let new_params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, params)
      let ref = admin.database(new_db).ref(`PDF/${obra}/${uuid}`);
      ref.update(new_params).then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      if(params.status == "ativo"){
        ref = admin.database(new_db).ref(`PDF/${obra}/ativo`);
        ref.set(uuid).then(function(){
          void(0)
        }).catch(function(error){
          console.log(error)
          res.status(507).send()
        });
      }
    }
    uploadFile().catch(console.error);
  }
  res.status(200).send();
});

app.post('/PDF_elementos', fileUpload(), function (req, res) {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  let user_uid = sessions_map.get(req.sessionID).uid
  const form_size = parseInt(req.body.formData_size)
  const obra = req.body.formData_obra
  const elemento = req.body.formData_elemento
  const date = req.body.formData_date
  for(let i = 1 ; i <= form_size; i++){
    let params = JSON.parse(req.body[`formData_${i}`])
    const history_uuid = crypto.randomUUID()
    if(params.activity == "remove"){
      let ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${params.uid}`);
      ref.remove().then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      new_bucket.file("PDF_elementos/"+obra+"/"+elemento+"/"+params.uid+"/some.pdf").delete();
      continue
    }
    if(params.activity == "status"){
      delete params.activity
      let history = {[history_uuid]: Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, params)}
      let ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${params.uid}/history`);
      ref.update(history).then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${params.uid}`);
      ref.update(params).then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      if(params.status == "ativo"){
        ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/ativo`);
        ref.set(params.uid).then(function(){
          void(0)
        }).catch(function(error){
          console.log(error)
          res.status(507).send()
        });
      }
      continue
    }
    delete params.activity
    const uuid = crypto.randomUUID()
    const filePath = "some.pdf"
    let pdf = req.files[`uploadedFile_${i}`]
    console.log(pdf)
    generatePdfFromBuffer(pdf.data)
    const bucketName = new_bucket.name;
    const destFileName = "PDF_elementos/"+obra+"/"+elemento+"/"+uuid+"/"+filePath;

    async function uploadFile() {
      await new_bucket.upload(filePath, {
        destination: destFileName,
        metadata: {      
          // "custom" metadata:
          metadata: {
            firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
          },
        }
      })
      params.pdfUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
      history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, params)
      let new_params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, params)
      let ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${uuid}`);
      ref.update(new_params).then(function(){
        void(0)
      }).catch(function(error){
        console.log(error)
        res.status(507).send()
      });
      if(params.status == "ativo"){
        ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/ativo`);
        ref.set(uuid).then(function(){
          void(0)
        }).catch(function(error){
          console.log(error)
          res.status(507).send()
        });
      }
    }
    uploadFile().catch(console.error);
  }
  res.status(200).send();
});

/*************************/
/********  ERROS  ********/
/*************************/

app.get('/erros', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref(`erros`);
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

/*************************/
/****  PROGRAMAÇÃO  *****/
/*************************/

app.get('/programacao', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref(`programacao`);
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/atualizar_programacao', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let programacao = req.body.programacao
  let ref = admin.database(new_db).ref(`programacao/`);
  ref.set(programacao).then(function(){
    res.status(200).send()
  }).catch(function(error) {
    console.log(error)
    res.status(507).send()
  });
});

/*************************/
/********  PEÇAS  ********/
/*************************/

app.get('/pecas', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref(`pecas`);
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

/*************************/
/******  ROMANEIO  *******/
/*************************/

app.get('/romaneio_num_carga', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref(`romaneio/00num_carga`);
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null){
      res.status(200).send({"carga": 0});
      return
    }
    res.status(200).send({"carga": snapshot.val()});
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.get('/romaneio_cargas', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let ref = admin.database(new_db).ref(`romaneio`);
  ref.once('value', (snapshot) => {
    if(snapshot.val() == null) res.status(404).send()
    else{res.status(200).send(snapshot.val())}
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
    res.status(507).send()
  }); 
});

app.post('/romaneio_post', (req, res) => {
  const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
  let user_uid = sessions_map.get(req.sessionID).uid
  Object.entries(req.body.params).forEach((child) => {
    const uuid = crypto.randomUUID()
    let date = child[1].date
    delete child[1].date
    let romaneio_carga = child[1].romaneio_carga
    let params = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
    let ref = admin.database(new_db).ref(`romaneio/${uuid}`);
    ref.update(params).then(function(){
      console.log("success1")
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
    ref = admin.database(new_db).ref(`romaneio/00num_carga`);
    ref.set(romaneio_carga).then(function(){
      console.log("success2")
    }).catch(function(error) {
      console.log(error)
      res.status(200).send()
    });
    Object.entries(child[1].pecas).forEach((peca) => {
      ref = admin.database(new_db).ref(`pecas/${child[1].obra}/${peca[1].elemento}/${peca[0]}/romaneio`);
      ref.set(uuid).then(function(){
        console.log("success2")
      }).catch(function(error) {
        console.log(error)
        res.status(200).send()
      });
    })

  });
  res.status(200).send()
});

/*************************/
/******  ACESSOS  *******/
/*************************/

app.post('/acesso_cadastrar', (req, res) => {
  const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
  const new_db = db
  let user_uid = sessions_map.get(req.sessionID).uid
  const uuid = crypto.randomUUID()
  const history_uuid = crypto.randomUUID()
  let history
  let ref
  Object.entries(req.body.params).forEach((child) => {
    let uid_transportadora = child[0]
    let date = child[1].date
    delete child[1].date
    if(!(child[1].image == undefined || child[1].image == null)){
      let extension = convertBase64ToFile(child[1].image)
      const filePath = "image." + extension;
      const bucketName = new_bucket.name;
      const destFileName = "motoristas/"+uid_transportadora+"/"+uuid+"/"+filePath;

      async function uploadFile() {
        await new_bucket.upload(filePath, {
          destination: destFileName,
          metadata: {      
            // "custom" metadata:
            metadata: {
              firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
            },
          }
        })
        child[1].imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
        history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
        let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
        ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}`);
        ref.update(params).then(function(){
          void(0)
        }).catch(function(error) {
          console.log(error)
          res.status(200).send()
        });
      }
      uploadFile().catch(console.error);
    }
    else{
      history = Object.assign({}, {"lastModifiedBy":user_uid, "lastModifiedOn":date}, child[1])
      let params = Object.assign({}, {"createdBy":user_uid, "creation":date, "history": {[history_uuid]: history}}, child[1])
      ref = admin.database(new_db).ref(`transportadoras/${uid_transportadora}/motoristas/${uuid}`);
      ref.update(params).then(function(){
        void(0)
      }).catch(function(error) {
        console.log(error)
        res.status(200).send()
      });
    }
  });
  res.status(200).send()
});

app.post('/forget_password', (req, res) => {
  let email = req.body.email
  firebaseAuth.sendPasswordResetEmail(auth, email, null).then(function() {
    res.status(200).send()
  })
  .catch(function(error) {
    // Error occurred. Inspect error.code.
    console.log(error)
    res.status(403).send({"error":error.code})
  });
})

//////////////////////////
function convertBase64ToFile(base64Image) {
  // Save the image synchronously.
  ba64.writeImageSync("image", base64Image); // Saves myimage.jpeg.
  // Or save the image asynchronously.
  ba64.writeImage("image", base64Image, function(err){
    if (err) throw err;
    console.log("Image saved successfully");
  })
  return ba64.getExt(base64Image)
}

function generatePdfFromBuffer(buffer){
  fs.writeFileSync("some.pdf", buffer)
}


//server starts listening for any attempts from a client to connect at port: {port}
//https.createServer(options, app).listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });          
app.listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });