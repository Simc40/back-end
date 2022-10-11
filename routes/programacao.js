
const admin = require("firebase-admin");                              

module.exports = function (app, sessions_map, get_database) {

    app.get('/programacao', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref(`programacao`);
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
    
    app.post('/atualizar_programacao', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let programacao = req.body.programacao
        let ref = admin.database(new_db).ref(`programacao/`);
        ref.set(programacao).then(function () {
            res.status(200).send()
        }).catch(function (error) {
            console.log(error)
            res.status(507).send()
        });
    });
}