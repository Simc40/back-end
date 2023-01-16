
const admin = require("firebase-admin");                              
const { Elemento } = require('../models/Elemento');
const { uploadInRealTimeDatabase } = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/elementos', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref('elementos');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
    
    app.post('/elementos_cadastrar', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let user_uid = sessions_map.get(req.sessionID).uid
        let elemento = new Elemento(req.body.params.obra, undefined, req.body.params, user_uid, true, false);

        uploadInRealTimeDatabase(new_db, `elementos/${elemento.uidObra}/${elemento.uid}`, elemento.firebaseObj, false)
        .then(()=>{
            res.status(200).send();
        })
        .catch((e) => {
            console.log(e);
            res.status(507).send();
        })
    });

    app.post('/elementos_cadastrar_all', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Array.from(req.body.params).forEach((value) => {
            const elemento = new Elemento(value.obra, value.uid, value, user_uid, true, false);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db,  `elementos/${elemento.uidObra}/${elemento.uid}`, elemento.firebaseObj, false)
                .then(resolve)
                .catch((e) => {
                    reject(e)
                })
            })
            promises.push(p);
        })
        Promise.all(promises)
        .then(() => {
            res.status(200).send();
        }).catch((e) => {
            console.log(e);
            res.status(507).send();
        })
    });

    app.put('/elementos_gerenciar', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const elemento = new Elemento(child[1].obra, child[0], child[1], user_uid, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db,  `elementos/${elemento.uidObra}/${elemento.uid}`, elemento.firebaseObj, false)
                .then(uploadInRealTimeDatabase(new_db,  `elementos/${elemento.uidObra}/${elemento.uid}/history/${elemento.history_uuid}`, elemento.firebaseObj, false))
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
}