const firebaseAuth = require("firebase/auth");
const auth = firebaseAuth.getAuth();                                                                // Constant for using Firebase Authentincation Functions
const { acessos } = require('../config/permissions')
const { CustomException } = require('../models/CustomException');

module.exports = function(app, db, sessions_map){
    app.post('/login', (req, res) => {
        const email = req.body.email; 
        const password = req.body.password;

        firebaseAuth.signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return userCredential.user.uid; // Signed in, pass userId from firebaseLogin.
        })
        .then((getUserInfo))
        .then((getClientInfo))
        .then((saveUserInSession))
        .then((resStatus) => {
            res.status(resStatus).send({'token': req.sessionID});
        })
        .catch((error) => {
            console.log(error);
            if (error.code == "auth/network-request-failed") res.status(500).send();
            else if (error.code == "auth/wrong-password") res.status(401).send();
            else if (error.code == "auth/user-not-found") res.status(401).send();
            else if (error.code.toString().startsWith("auth")) res.status(401).send();
            else res.status(error.code).send();
        });

        function getUserInfo(uid){
            return new Promise((resolve, reject) => {
                const ref = db.ref(`usuarios/${uid}`);
                ref.once('value')
                .then(function (snapshot) {
                    if (snapshot.val() == null) reject(CustomException("Usuário não encontrado no FirebaseDatabase", 507));
                    const snapshotResult = snapshot.val();
                    const user = {
                        "uid": uid,
                        "cliente": snapshotResult.cliente,
                        "nome": snapshotResult.nome,
                        "acesso": snapshotResult.acesso,
                        "imgUrl": snapshotResult.imgUrl,
                        "acessos_atividades" : snapshotResult.acessos_atividades
                    }
                    for (const [key, value] of Object.entries(user)) if (key != "imgUrl") if(value == undefined || value == null || value == "") reject(CustomException("O valor de " + key + " não foi enontrado no usuário " + user.uid, 507));
                    resolve(user);
                })
                .catch((error) => {
                    reject(CustomException(error.message, 507));
                });
            })
        }

        function getClientInfo(user){
            return new Promise((resolve, reject) => {
                const ref = db.ref(`clientes/${user.cliente}`);
                ref.once('value')
                .then(function (snapshot) {
                    const snapshotResult = snapshot.val();
                    if (snapshot.val() == null) reject(CustomException("Cliente não encontrado no FirebaseDatabase", 507));
                    const cliente = { 
                        "storage": snapshotResult.storage,
                        "database": snapshotResult.database,
                        "uid": snapshotResult.uid,
                        "nome": snapshotResult.nome,
                        "logo": snapshotResult.logoUrl 
                    }
                    for (const [key, value] of Object.entries(cliente)) if (key != "logo") if(value == undefined || value == null || value == "") reject(CustomException("O valor de " + key + " não foi enontrado no cliente " + user.cliente, 507));
                    user.cliente = cliente;
                    resolve(user)
                }).catch((error) => {
                    reject(CustomException(error.message, 507));
                })
            })
        }

        function saveUserInSession(user){
            return new Promise((resolve, reject) => {
                try {
                    if (user.acesso == acessos.admin) {
                        sessions_map.set(req.sessionID, user);
                        resolve(202);
                    } else if (user.acesso == acessos.responsavel || user.acessos_atividades.Website == "ativo"){
                        sessions_map.set(req.sessionID, user);
                        resolve(200);
                    }
                    else if(user.acessos_atividades.Website == "inativo") reject(CustomException("Usuário não permitido", 403))
                    else reject(CustomException("Permissão não encontrada no banco de dados", 507))
                } catch (error) {
                    reject(CustomException(error.message, 507));
                }
            })
        }

    });

    app.put('/set-cliente', (req, res) => {
        if (sessions_map.get(req.sessionID).acesso != acessos.admin) {
            res.status(403).send();
            return
        }
        const cliente = (req.body.client == undefined) ? { 
            "uid": req.body.uid,
            "database": req.body.database,
            "nome": req.body.nome,
            "storage": req.body.storage,
            "logo": req.body.logoUrl 
        } : req.body.client
        let user = sessions_map.get(req.sessionID)
        user.database = cliente.database
        const ref = db.ref(`usuarios/${user.uid}`)
        ref.update({ 'cliente': cliente.uid }).then(function () {
            user.cliente = cliente
            res.status(200).send()
        }).catch(function (error) {
            console.log("Data could not be saved." + error);
            res.status(507).send()
        });
    });

    app.delete('/logout', (req, res) => {
        try {
            sessions_map.delete(req.sessionID)
        } catch (error) {
            console.log(error)
        }
        res.status(200).send("Logout")
    });
}