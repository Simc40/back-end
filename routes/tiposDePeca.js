const admin = require("firebase-admin");                              
const { TipoDePeca } = require('../models/TipoDePeca');
const { uploadFile } = require('../models/UploadFile');
const { uploadInRealTimeDatabase } = require("../models/firebaseDatabase");

module.exports = function(app, defaultApp, sessions_map, get_database){
    
    app.get('/tipos_de_peca', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref('tipos_peca');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });

    app.post('/tipos_de_peca_cadastrar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const tipoDePeca = new TipoDePeca(undefined, req.body.params, user_uid, "tipos_peca/", "imgUrl", new_bucket, true, false);
        new Promise ((resolve, reject) => {
            if(tipoDePeca.hasImage()){
                uploadFile(new_bucket, tipoDePeca.uid, tipoDePeca.image)
                .then(() => {
                    resolve()
                }).catch((e) =>{
                    reject(e)
                });
            }else{
                resolve()
            }
        })
        .then(uploadInRealTimeDatabase(new_db, `tipos_peca/${tipoDePeca.uid}`, tipoDePeca.firebaseObj, false))
        .then(() => {
            res.status(200).send();
        })
        .catch((e) =>{
            console.log(e);
            res.status(507).send();
        })
    });

    app.put('/tipos_de_peca_gerenciar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const tipoDePeca = new TipoDePeca(child[0], child[1], user_uid, undefined, undefined, undefined, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db, `tipos_peca/${tipoDePeca.uid}`, tipoDePeca.firebaseObj, false)
                .then(uploadInRealTimeDatabase(new_db, `tipos_peca/${tipoDePeca.uid}/history/${tipoDePeca.history_uuid}`, tipoDePeca.firebaseObj, false))
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

    app.put('/tipos_de_peca_editar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        Object.entries(req.body.params).forEach((child) => {
            const tipoDePeca = new TipoDePeca(child[0], child[1], user_uid, "tipos_peca/", "imgUrl", new_bucket, false, true);
            new Promise ((resolve, reject) => {
                if(tipoDePeca.hasImage()){
                    uploadFile(new_bucket, tipoDePeca.uid, tipoDePeca.image)
                    .then(() => {
                        resolve();
                    }).catch((e) =>{
                        reject(e)
                    });
                }else{
                    resolve();
                }
            })
            .then(uploadInRealTimeDatabase(new_db, `tipos_peca/${tipoDePeca.uid}`, tipoDePeca.firebaseObj, false))
            .then(uploadInRealTimeDatabase(new_db, `tipos_peca/${tipoDePeca.uid}/history/${tipoDePeca.history_uuid}`, tipoDePeca.firebaseObj, false))
            .then(() => {
                res.status(200).send();
            })
            .catch((e) =>{
                console.log(e);
                res.status(507).send();
            });
        });
    });
}