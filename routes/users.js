const firebaseAuth = require("firebase/auth");
const auth = firebaseAuth.getAuth();                                                                // Constant for using Firebase Authentincation Functions
const { acessos } = require('../config/permissions')
const { User } = require('../models/User');
const { uploadFile } = require('../models/UploadFile');
const { uploadInRealTimeDatabase } = require("../models/firebaseDatabase");

module.exports = function(app, defaultApp, db, sessions_map){
    
    app.post('/acessos_cadastrar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid;
        const newUserEmail = req.body.params.cadastrar.email;
        if (sessions_map.get(req.sessionID).acesso == acessos.usuario) {
            res.status(403).send();
            return;
        }
        const dbucket = defaultApp.storage().bucket();
        firebaseAuth.createUserWithEmailAndPassword(auth, newUserEmail, "newaccountsimc99")
        .then((userCredential) => {
            if(userCredential == undefined) throw Error("createUserWithEmailAndPassword failed");
            return new User(userCredential.user.uid, req.body.params.cadastrar, user_uid, "profiles/", "imgUrl", dbucket, true, false);
        })
        .then((user) => {
            firebaseAuth.sendPasswordResetEmail(auth, user.firebaseObj.email, null)
            return user;
        })
        .then((user) => new Promise((resolve, reject) => {
            if(user.hasImage()){
                uploadFile(dbucket, user.uid, user.image)
                .then(() => {
                    resolve(user)
                }).catch((e) =>{
                    reject(e)
                });
            }else{
                resolve(user)
            }
        }))
        .then((user) => uploadInRealTimeDatabase(db, `usuarios/${user.uid}`, user.firebaseObj, true))
        .then(() => {
            res.status(200).send();
        })
        .catch((error) => {
            console.log(error)
            if (error.code == "auth/email-already-in-use") res.status(403).send();
            else res.status(507).send();
        })
    });

    app.put('/acessos_gerenciar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const user = new User(child[0], child[1], user_uid, undefined, undefined, undefined, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(db, `usuarios/${user.uid}`, user.firebaseObj, true)
                .then(uploadInRealTimeDatabase(db, `usuarios/${user.uid}/history/${user.history_uuid}`, user.firebaseObj, true))
                .then(resolve)
                .catch((e) => {
                    reject(e)
                })
            })
            promises.push(p);
        });
        Promise.all(promises)
        .then(() => {
            res.status(200).send();
        }).catch((e) => {
            console.log(e);
            res.status(507).send();
        })
    });

    app.put('/acessos_editar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid;
        const dbucket = defaultApp.storage().bucket();
    
        Object.entries(req.body.params).forEach((child) => {
            const user = new User(child[0], child[1], user_uid, "profiles/", "imgUrl", dbucket, false, true);
            new Promise ((resolve, reject) => {
                if(user.hasImage()){
                    uploadFile(dbucket, user.uid, user.image)
                    .then(resolve)
                    .catch((e) =>{
                        reject(e);
                    });
                }else{
                    resolve();
                }
            })
            .then(uploadInRealTimeDatabase(db, `usuarios/${user.uid}`, user.firebaseObj, true))
            .then(uploadInRealTimeDatabase(db, `usuarios/${user.uid}/history/${user.history_uuid}`, user.firebaseObj, true))
            .then(() => {
                res.status(200).send();
            })
            .catch((e) =>{
                console.log(e);
                res.status(507).send();
            });
        });
    });

    app.get('/cliente_de_usuario', (req, res) => {
        try {
            let cliente = sessions_map.get(req.sessionID).cliente
            let acesso = undefined
            if (sessions_map.get(req.sessionID).acesso == acessos.admin) acesso = "admin"
            else if (sessions_map.get(req.sessionID).acesso == acessos.responsavel) acesso = "responsavel"
            else if (sessions_map.get(req.sessionID).acesso == acessos.usuario) acesso = "usuario"
            res.status(200).send({ "cliente_uid": cliente.uid, "cliente_nome": cliente.nome, "user_acesso": acesso })
        } catch {
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
                if (child[1].cliente == cliente_uid && child[1].acesso != acessos.admin) {
                    response[child[0]] = child[1]
                }
            });
            if (Object.keys(response).length === 0) res.status(204).send()
            else { res.status(200).send(response) }
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
                if (child[1].cliente == cliente_uid || child[1].acesso == acessos.admin) {
                    response[child[0]] = child[1].nome
                }
            });
            if (Object.keys(response).length === 0) res.status(204).send()
            else { res.status(200).send(response) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
}