
const admin = require("firebase-admin");                              
const { Checklist } = require('../models/Checklist');
const { uploadInRealTimeDatabase, setInRealTimeDatabase} = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/checklist', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref('checklist');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
    
    app.put('/checklist_post', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const checklist = new Checklist(child[0], child[1], user_uid);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db, `checklist/history/${checklist.etapa}/${checklist.history_uuid}`, checklist.firebaseObj, false)
                .then(setInRealTimeDatabase(new_db, `checklist/${checklist.etapa}`, checklist.history_uuid, false))
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