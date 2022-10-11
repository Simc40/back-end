
const admin = require("firebase-admin");                              
const { Romaneio } = require('../models/Romaneio');
const { uploadInRealTimeDatabase, setInRealTimeDatabase } = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/romaneio_num_carga', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref(`romaneio/00num_carga`);
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) {
                res.status(200).send({ "carga": 0 });
                return
            }
            res.status(200).send({ "carga": snapshot.val() });
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
    
    app.get('/romaneio_cargas', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref(`romaneio`);
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });

    app.post('/romaneio_post', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const romaneio = new Romaneio(undefined, req.body.params.romaneio, user_uid, true, false)
        uploadInRealTimeDatabase(new_db, `romaneio/${romaneio.uid}`, romaneio.firebaseObj, false)
        .then(setInRealTimeDatabase(new_db, `romaneio/00num_carga`, romaneio.numCarga, false))
        .then(updateRomaneioPecas(new_db, romaneio))
        .then(() => res.status(200).send())
        .catch((e) => {
            console.log(e)
            res.status(507).send();
        })
    });

    async function updateRomaneioPecas(new_db, romaneio){
        new Promise((resolve, reject) => {
            let promises = [];
            Object.entries(romaneio.pecas).forEach((peca) => {
                let p = new Promise((resolve, reject) => {
                    setInRealTimeDatabase(new_db, `pecas/${romaneio.uidObra}/${peca[1]}/${peca[0]}/romaneio`, romaneio.uid, false)
                    .then(resolve)
                    .catch((e) => {
                        console.log(e);
                        reject(e);
                    });
                });
                promises.push(p);
            })
            Promise.all(promises)
            .then(() => resolve)
            .catch((e) => reject(e))
        });
    }
}