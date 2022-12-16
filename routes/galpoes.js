
const admin = require("firebase-admin");                              
const { Galpao } = require('../models/Galpao');
const { uploadInRealTimeDatabase } = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/galpoes', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref('galpoes');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });

    app.post('/galpoes_cadastrar', (req, res) => {
        let user_uid = sessions_map.get(req.sessionID).uid
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const galpao = new Galpao(undefined, req.body.params, user_uid, true, false)
        uploadInRealTimeDatabase(new_db, `galpoes/${galpao.uid}`, galpao.firebaseObj, false)
        .then(() =>{
            res.status(200).send()
        })
        .catch((e) => {
            console.log(e)
            res.status(507).send()
        })
    });
    
    app.put('/galpoes_gerenciar', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const galpao = new Galpao(child[0], child[1], user_uid, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db, `galpoes/${galpao.uid}`, galpao.firebaseObj, false)
                .then(uploadInRealTimeDatabase(new_db, `galpoes/${galpao.uid}/history/${galpao.history_uuid}`, galpao.firebaseObj, false))
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