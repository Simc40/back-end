
const admin = require("firebase-admin");                              
const { uploadInRealTimeDatabase, setInRealTimeDatabase } = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/pecas', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref(`pecas`);
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });

    app.post('/qrcode', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref(`pecas`);
        let obra;
        let promises = [];
        // console.log(req.body.params)
        let elements = {};
        Object.values(req.body.params).forEach((child) => {
            obra = child.element.obra;
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db, `pecas/${child.element.obra}/${child.element.uid}/${child.form.uid}`, child.form, false)
                .then(() => {
                    elements[child.element.uid] = elements[child.element.uid] === undefined ? parseInt(child.element.numPecas) + 1 : elements[child.element.uid] + 1;
                })
                .then(resolve)
                .catch((e) => {
                    reject(e)
                })
            })
            promises.push(p);
        });

        let getPiecesObra = new Promise((resolve, reject) => {
            let ref = admin.database(new_db).ref(`obras/${obra}/pecas_registradas`);
            ref.once('value', (snapshot) => {
                if (snapshot.val() == null) reject();
                else { resolve(snapshot.val()) }
            }, (errorObject) => {
                console.log(errorObject)
                reject()
            });
        })

        function uploadObraPieces(numPieces){
            return new Promise((resolve, reject) => {
                setInRealTimeDatabase(new_db, `obras/${obra}/pecas_registradas`, numPieces, false)
                .then(resolve)
                .catch((e) => {
                    reject(e)
                })
            })
        }

        const elementPromisesFunction = () => {
            let elementsPromises = []
            Object.entries(elements).forEach((element) => {
                let elemProm = new Promise((resolve, reject) => {
                    setInRealTimeDatabase(new_db, `elementos/${obra}/${element[0]}/numPecas`, element[1].toString(), false)
                    .then(resolve)
                    .catch((e) => {
                        reject(e)
                    })
                })
                elementsPromises.push(elemProm);
            });
            return elementsPromises;
        }

        Promise.all(promises)
        .then(elementPromisesFunction)
        .then((elementPromises) => {
            Promise.all(elementPromises)
            .then(() => {
                getPiecesObra
                .then((numPieces) => {
                    const intNumPieces = parseInt(numPieces);
                    const finalNumPieces = intNumPieces + promises.length;
                    return finalNumPieces.toString();
                })
                .then(uploadObraPieces)
            })
        })
        .then(() => {
            res.status(200).send();
        })
        .catch((e) => {
            console.log(e);
            res.status(507).send();
        })
    });
}