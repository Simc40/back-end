
const admin = require("firebase-admin");                              
const { Elemento } = require('../models/Elemento');
const { Peca } = require('../models/Peca');
const { uploadInRealTimeDatabase } = require('../models/firebaseDatabase');

module.exports = function (app, sessions_map, get_database) {

    app.get('/elementos', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let ref = admin.database(new_db).ref('elementos');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send()
            else { res.status(200).send(snapshot.val()) }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send()
        });
    });
    
    app.post('/elementos_cadastrar', async (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const user_uid = sessions_map.get(req.sessionID).uid
        const elemento = new Elemento(req.body.params.obra, undefined, req.body.params, user_uid, true, false);
        const ClientAcronimo = sessions_map.get(req.sessionID).cliente.acronimo;
        const numPecas = parseInt(elemento.firebaseObj.numMax);
        let maiorValorQrCode = 0;
        let promises = [];

        const promiseRetornarAcronimoDeObra = new Promise((resolve, reject) => {
            let ref = admin.database(new_db).ref(`obras/${req.body.params.obra}/acronimo`);
            ref.once('value', (snapshot) => {
                if (snapshot.val() === null) reject();
                else { resolve(snapshot.val()) }
            }, (errorObject) => {
                console.log(errorObject)
                reject()
            });
        })

        const promiseRetornarMaiorValorDeQrCode = () => { 
            return new Promise((resolve, reject) => {
                let ref = admin.database(new_db).ref(`pecas/${req.body.params.obra}`);
                ref.once('value', (snapshot) => {
                    if (snapshot.val() === null) resolve(1);
                    else {
                        let maiorQrCode = 0;
                        const elementos = snapshot.val();
                        Object.entries(elementos).forEach((child) => {
                            const elementoUid = child[0];
                            const pecas = child[1];
                            Object.entries(pecas).forEach((child) => {
                                const pecaUid = child[0];
                                const peca = child[1];
                                const indexDoUltimoTracoDoQrCode = peca.qrCode.lastIndexOf("-")
                                const numeroDoQrCode = parseInt(peca.qrCode.slice(indexDoUltimoTracoDoQrCode + 1))                            
                                if(numeroDoQrCode > maiorQrCode) maiorQrCode = numeroDoQrCode;
                            });
                        });
                        resolve(maiorQrCode + 1);
                    }
                }, (errorObject) => {
                    console.log(errorObject)
                    reject()
                });
            })
        }

        const promiseSalvarElemento = new Promise((resolve, reject) => {
            uploadInRealTimeDatabase(new_db, `elementos/${elemento.uidObra}/${elemento.uid}`, elemento.firebaseObj, false)
            .then(resolve)
            .catch((e) => {
                reject(e)
            })
        })
        promises.push(promiseSalvarElemento);

        await promiseRetornarMaiorValorDeQrCode().then((valorDeQrCode)=> {maiorValorQrCode = valorDeQrCode})
        promiseRetornarAcronimoDeObra
        .then((obraAcronimo) => {
            let j = 1;
            for(let i = maiorValorQrCode; i < numPecas + maiorValorQrCode ; i++){
                const peca = new Peca(ClientAcronimo, obraAcronimo, elemento.uidObra, elemento.uid, elemento.firebaseObj.nome_elemento, j, i, user_uid);
                let p = new Promise((resolve, reject) => {
                    uploadInRealTimeDatabase(new_db,  `pecas/${elemento.uidObra}/${elemento.uid}/${peca.uid}`, peca.firebaseObj, false)
                    .then(resolve)
                    .catch((e) => {
                        reject(e)
                    })
                })
                promises.push(p);
                j++;
            }
            return promises;
        })
        .then((promises) => Promise.all(promises))
        .then(()=>{res.status(200).send()})
        .catch((e) => {
            console.log(e);
            res.status(507).send();
        })
    });

    app.post('/elementos_cadastrar_all', async (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const clientAcronimo = sessions_map.get(req.sessionID).cliente.acronimo;
        let user_uid = sessions_map.get(req.sessionID).uid
        let maiorValorQrCode = 0;
        let promises = [];

        const uidObra = Array.from(req.body.params)[0].obra;
        const promiseRetornarAcronimoDeObra = new Promise((resolve, reject) => {
            let ref = admin.database(new_db).ref(`obras/${uidObra}/acronimo`);
            ref.once('value', (snapshot) => {
                if (snapshot.val() == null) reject();
                else { resolve(snapshot.val()) }
            }, (errorObject) => {
                console.log(errorObject)
                reject()
            });
        })

        const promiseRetornarMaiorValorDeQrCode = () => { 
            return new Promise((resolve, reject) => {
                let ref = admin.database(new_db).ref(`pecas/${req.body.params.obra}`);
                ref.once('value', (snapshot) => {
                    if (snapshot.val() === null) resolve(1);
                    else {
                        let maiorQrCode = 0;
                        const elementos = snapshot.val();
                        Object.entries(elementos).forEach((child) => {
                            const elementoUid = child[0];
                            const pecas = child[1];
                            Object.entries(pecas).forEach((child) => {
                                const pecaUid = child[0];
                                const peca = child[1];
                                const indexDoUltimoTracoDoQrCode = peca.qrCode.lastIndexOf("-")
                                const numeroDoQrCode = parseInt(peca.qrCode.slice(indexDoUltimoTracoDoQrCode + 1))                            
                                if(numeroDoQrCode > maiorQrCode) maiorQrCode = numeroDoQrCode;
                            });
                        });
                        resolve(maiorQrCode + 1);
                    }
                }, (errorObject) => {
                    console.log(errorObject)
                    reject()
                });
            })
        }

        await promiseRetornarMaiorValorDeQrCode().then((valorDeQrCode)=> {maiorValorQrCode = valorDeQrCode})
        promiseRetornarAcronimoDeObra
        .then((obraAcronimo) => {
            Array.from(req.body.params).forEach((value) => {
                const elemento = new Elemento(value.obra, value.uid, value, user_uid, true, false);
                let p = new Promise((resolve, reject) => {
                    uploadInRealTimeDatabase(new_db,  `elementos/${elemento.uidObra}/${elemento.uid}`, elemento.firebaseObj, false)
                    .then(resolve)
                    .catch((e) => {
                        reject(e)
                    })
                })
                promises.push(p);
                const numPecas = parseInt(elemento.firebaseObj.numMax);
                let j = 1;
                for(let i = maiorValorQrCode; i < numPecas + maiorValorQrCode ; i++){
                    const peca = new Peca(clientAcronimo, obraAcronimo, elemento.uidObra, elemento.uid, elemento.firebaseObj.nome_elemento,j, i, user_uid);
                    let p = new Promise((resolve, reject) => {
                        uploadInRealTimeDatabase(new_db,  `pecas/${elemento.uidObra}/${elemento.uid}/${peca.uid}`, peca.firebaseObj, false)
                        .then(resolve)
                        .catch((e) => {
                            reject(e)
                        })
                    })
                    promises.push(p);
                    j++;
                }
                maiorValorQrCode = maiorValorQrCode + numPecas;
            })
            return promises;
        })
        .then((promises) => Promise.all(promises))
        .then(()=>{res.status(200).send()})
        .catch((e) => {
            console.log(e);
            res.status(507).send();
        })
        
        // Promise.all(promises)
        // .then(() => {
        //     res.status(200).send();
        // }).catch((e) => {
        //     console.log(e);
        //     res.status(507).send();
        // })
    });

    app.put('/elementos_gerenciar', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        let user_uid = sessions_map.get(req.sessionID).uid
        let promises = [];
        Object.entries(req.body.params).forEach((child) => {
            const elemento = new Elemento(child[1].obra, child[0], child[1], user_uid, false, true);
            let p = new Promise((resolve, reject) => {
                uploadInRealTimeDatabase(new_db,  `elementos/${elemento.uidObra}/${elemento.uid}`, elemento.firebaseObj, false)
                .then(uploadInRealTimeDatabase(new_db,  `elementos/${elemento.uidObra}/${elemento.uid}/history/${elemento.history_uuid}`, elemento.firebaseObj, false))
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