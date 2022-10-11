const { Veiculo } = require('../models/Veiculo');
const { uploadInRealTimeDatabase } = require("../models/firebaseDatabase");

module.exports = function(app, sessions_map, get_database){

    app.post('/transportadoras_veiculos_cadastrar', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const veiculo = new Veiculo(undefined, req.body.params.cadastrar, user_uid, true, false)
        uploadInRealTimeDatabase(new_db, `transportadoras/${veiculo.uidTransportadora}/veiculos/${veiculo.uid}`, veiculo.firebaseObj, false)
        .then(() =>{
            res.status(200).send()
        })
        .catch((e) => {
            console.log(e)
            res.status(507).send()
        })
    });
    
    app.put('/transportadoras_veiculos_gerenciar', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const veiculo = new Veiculo(child[0], child[1], user_uid, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db, `transportadoras/${veiculo.uidTransportadora}/veiculos/${veiculo.uid}`, veiculo.firebaseObj, false)
                .then(uploadInRealTimeDatabase(new_db, `transportadoras/${veiculo.uidTransportadora}/veiculos/${veiculo.uid}/history/${veiculo.history_uuid}`, veiculo.firebaseObj, false))
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