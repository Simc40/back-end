
const { acessos } = require('../config/permissions');
const { Cliente } = require('../models/Cliente');
const { uploadFile } = require('../models/UploadFile');
const { uploadInRealTimeDatabase , rootFirebaseDatabaseNode} = require('../models/firebaseDatabase');
const JSON_new_client = require('../simc-iot-new-cliente.json');

module.exports = function (app, defaultApp, db, sessions_map, get_database) {

    app.get('/clientes', (req, res) => {
        if (sessions_map.get(req.sessionID).acesso != acessos.admin) {
            res.status(403).send();
            return
        }
        const ref = db.ref('clientes');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send();
            else res.status(200).send(snapshot.val());
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send();
        });
    });

    app.post('/clientes_cadastrar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        if (sessions_map.get(req.sessionID).acesso != acessos.admin) {
            res.status(403).send();
            return
        }
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        let cliente = new Cliente(undefined, req.body.params.cadastrar, user_uid, "logo/", "logoUrl", new_bucket, true, false);
        const new_db = get_database(cliente.firebaseObj.database);
        new Promise ((resolve, reject) => {
            if(cliente.hasImage()){
                uploadFile(new_bucket, cliente.uid, cliente.image)
                .then(() => {
                    resolve()
                }).catch((e) =>{
                    reject(e)
                });
            }else{
                resolve()
            }
        })
        .then(uploadInRealTimeDatabase(new_db, rootFirebaseDatabaseNode, JSON_new_client, false))
        .then(uploadInRealTimeDatabase(db, `clientes/${cliente.uid}`, cliente.firebaseObj, true))
        .then(() => {
            res.status(200).send();
        })
        .catch((e) =>{
            console.log(e);
            res.status(507).send();
        })
    });
    
    app.put('/clientes_gerenciar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        if (sessions_map.get(req.sessionID).acesso != acessos.admin) {
            res.status(403).send();
            return
        }
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            let cliente = new Cliente(child[0], child[1], user_uid, undefined, undefined, undefined, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(db, `clientes/${cliente.uid}`, cliente.firebaseObj, true)
                .then(uploadInRealTimeDatabase(db, `clientes/${cliente.uid}/history/${cliente.history_uuid}`, cliente.firebaseObj, true))
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

    app.put('/clientes_editar', (req, res) => {
        let user_uid = sessions_map.get(req.sessionID).uid
        if (sessions_map.get(req.sessionID).acesso != acessos.admin) {
            res.status(403).send();
            return
        }
        let cliente
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        Object.entries(req.body.params).forEach((child) => {
            cliente = new Cliente(child[0], child[1], user_uid, "logo/", "logoUrl", new_bucket, false, true);
        });
        new Promise ((resolve, reject) => {
            if(cliente.hasImage()){
                uploadFile(new_bucket, cliente.uid, cliente.image)
                .then(() => {
                    resolve()
                }).catch((e) =>{
                    reject(e)
                });
            }else{
                resolve()
            }
        })
        .then(uploadInRealTimeDatabase(db, `clientes/${cliente.uid}`, cliente.firebaseObj, true))
        .then(uploadInRealTimeDatabase(db, `clientes/${cliente.uid}/history/${cliente.history_uuid}`, cliente.firebaseObj, true))
        .then(() => {
            res.status(200).send();
        })
        .catch((e) =>{
            console.log(e);
            res.status(507).send();
        })
    });
}