const { acessos } = require('../config/permissions')

module.exports = function(app, sessions_map){

    app.get('/check-session', (req, res) => {
        if (sessions_map.has(req.sessionID)) {
            let success = {}
            success.uid = sessions_map.get(req.sessionID).uid
            success.user_name = sessions_map.get(req.sessionID).nome
            success.imgUrl = sessions_map.get(req.sessionID).imgUrl
            success.acesso = Object.keys(acessos).find(key => acessos[key] === sessions_map.get(req.sessionID).acesso);
            success.cliente = sessions_map.get(req.sessionID).cliente.nome
            success.clienteUid = sessions_map.get(req.sessionID).cliente.uid
            success.logoUrl = (sessions_map.get(req.sessionID).cliente.logo !== undefined) ? sessions_map.get(req.sessionID).cliente.logo : sessions_map.get(req.sessionID).cliente.logoUrl; 
            success.token = req.sessionID
            res.status(200).send(success)
            return
        }
        res.status(204).send()
    });
}