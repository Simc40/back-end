const { acessosFromUid } = require('../config/permissions');


module.exports = function (app, sessions_map, db) {

    app.get('/profile', (req, res) => {
        const user_uid = sessions_map.get(req.sessionID).uid;   
        const ref = db.ref(`usuarios/${user_uid}`);
        ref.once('value', (snapshot) => {
            let response = snapshot.val();
            if (snapshot.val() == null) {
                res.status(507).send()
                return
            }
            try{
                response.acesso = acessosFromUid[sessions_map.get(req.sessionID).acesso]
                response.cliente = sessions_map.get(req.sessionID).cliente.nome
                res.status(200).send(response);
            }catch(e){
                console.log(e);
                res.status(507).send();
                return
            }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
}