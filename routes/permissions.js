
const { acessos } = require('../config/permissions')

module.exports = function (app, db, sessions_map) {

    app.post('/page_permission', (req, res) => {
        if (sessions_map.get(req.sessionID).acesso != acessos.usuario) {
            res.status(200).send();
            return
        }
        const user_uid = sessions_map.get(req.sessionID).uid
        const atividade = req.body.atividade
        const ref = db.ref(`usuarios/${user_uid}/acessos_atividades/${atividade}`);
        ref.once('value', (snapshot) => {
            if (snapshot.val() == "ativo") res.status(200).send();
            else if (snapshot.val() == "inativo") res.status(403).send();
            else { res.status(500).send() }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(500).send()
        });
    });

    app.get('/acessos', (_req, res) => {
        const ref = db.ref('tipos_acesso');
        ref.once('value', (snapshot) => {
            res.status(200).send(snapshot.val());
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send();
        });
    });
}