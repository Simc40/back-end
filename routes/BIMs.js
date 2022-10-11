
const admin = require("firebase-admin");                              
const { BIM } = require('../models/BIM');
const { CustomException } = require("../models/CustomException");
const { uploadInRealTimeDatabase } = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/BIM', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref(`BIM`);
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
    
    app.post('/BIM_create_bucket', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const user_uid = sessions_map.get(req.sessionID).uid
        let params = req.body.params
        for (const uid_obra in params) {
            const bim = new BIM(uid_obra, params[uid_obra], user_uid, true, false);
            uploadInRealTimeDatabase(new_db, `BIM/${bim.uidObra}`, bim.firebaseObj, false)
            .then(() =>{
                res.status(200).send()
            })
            .catch((e) => {
                console.log(e)
                res.status(507).send()
            })
        }
    });
    
    app.post('/BIM_create_object', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const user_uid = sessions_map.get(req.sessionID).uid
        let params = req.body.params
        for (const uid_obra in params) {
            const bim = new BIM(uid_obra, params[uid_obra], user_uid, false, true);
            const ref = admin.database(new_db).ref(`BIM/${bim.uidObra}`);
            new Promise((resolve, reject) => {
                ref.once('value', (snapshot) => {
                    if (snapshot.val() == null) throw CustomException("BIM doesn't have bucket", "BIM/bucketNull");
                    resolve();
                }, (errorObject) => {
                    console.log('The read failed: ' + errorObject.name);
                    reject(errorObject);
                });
            })
            .then(uploadInRealTimeDatabase(new_db, `BIM/${bim.uidObra}`, bim.firebaseObj, false))
            .then(uploadInRealTimeDatabase(new_db, `BIM/${bim.uidObra}/history/${bim.history_uuid}`, bim.firebaseObj, false))
            .then(() => {
                res.status(200).send()
            })
            .catch((error) => {
                console.log(error);
                if (error.code == "BIM/bucketNull") res.status(204).send();
                else res.status(507).send();
            });
            
        }
    });
}