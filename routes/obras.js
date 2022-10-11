
const admin = require("firebase-admin");                              
const { Obra } = require('../models/Obra');
const { uploadInRealTimeDatabase } = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/obras', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref('obras');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });

    app.post('/obras_cadastrar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const obra = new Obra(undefined, req.body.params.cadastrar, user_uid, true, false)
        uploadInRealTimeDatabase(new_db, `obras/${obra.uid}`, obra.firebaseObj, false)
        .then(() =>{
            res.status(200).send()
        })
        .catch((e) => {
            console.log(e)
            res.status(507).send()
        })
    });
    
    app.put('/obras_gerenciar', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const obra = new Obra(child[0], child[1], user_uid, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db, `obras/${obra.uid}`, obra.firebaseObj, false)
                .then(uploadInRealTimeDatabase(new_db, `obras/${obra.uid}/history/${obra.history_uuid}`, obra.firebaseObj, false))
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