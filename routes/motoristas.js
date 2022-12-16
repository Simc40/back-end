const admin = require("firebase-admin");                              
const { Motorista } = require('../models/Motorista');
const { uploadFile } = require('../models/UploadFile');
const { uploadInRealTimeDatabase } = require("../models/firebaseDatabase");

module.exports = function(app, defaultApp, sessions_map, get_database){

    app.post('/transportadoras_motoristas_cadastrar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const motorista = new Motorista(undefined, req.body.params, user_uid, "motoristas/", "imgUrl", new_bucket, true, false);
        new Promise ((resolve, reject) => {
            if(motorista.hasImage()){
                uploadFile(new_bucket, motorista.uid, motorista.image)
                .then(() => {
                    resolve()
                }).catch((e) =>{
                    reject(e)
                });
            }else{
                resolve()
            }
        })
        .then(uploadInRealTimeDatabase(new_db, `transportadoras/${motorista.uidTransportadora}/motoristas/${motorista.uid}`, motorista.firebaseObj, false))
        .then(() => {
            res.status(200).send();
        })
        .catch((e) =>{
            console.log(e);
            res.status(507).send();
        })
    });

    app.put('/transportadoras_motoristas_gerenciar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const motorista = new Motorista(child[0], child[1], user_uid, undefined, undefined, undefined, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db, `transportadoras/${motorista.uidTransportadora}/motoristas/${motorista.uid}`, motorista.firebaseObj, false)
                .then(uploadInRealTimeDatabase(new_db, `transportadoras/${motorista.uidTransportadora}/motoristas/${motorista.uid}/history/${motorista.history_uuid}`, motorista.firebaseObj, false))
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

    app.put('/transportadoras_motoristas_editar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        Object.entries(req.body.params).forEach((child) => {
            const motorista = new Motorista(child[0], child[1], user_uid, "motoristas/", "imgUrl", new_bucket, false, true);
            new Promise ((resolve, reject) => {
                if(motorista.hasImage()){
                    uploadFile(new_db, motorista.uid, motorista.image)
                    .then(resolve)
                    .catch((e) =>{
                        reject(e);
                    });
                }else{
                    resolve();
                }
            })
            .then(uploadInRealTimeDatabase(new_db, `transportadoras/${motorista.uidTransportadora}/motoristas/${motorista.uid}`, motorista.firebaseObj, false))
            .then(uploadInRealTimeDatabase(new_db, `transportadoras/${motorista.uidTransportadora}/motoristas/${motorista.uid}/history/${motorista.history_uuid}`, motorista.firebaseObj, false))
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