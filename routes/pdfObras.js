const fileUpload = require('express-fileupload');
const admin = require("firebase-admin");                              
const { PdfObra } = require('../models/PdfObra');
const { uploadPDF } = require('../models/UploadFile');
const { uploadInRealTimeDatabase, removeInRealTimeDatabase, setInRealTimeDatabase } = require("../models/firebaseDatabase");

module.exports = function(app, defaultApp, sessions_map, get_database){
    
    app.get('/PDF', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database);
        let ref = admin.database(new_db).ref('PDF');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send();
            else { res.status(200).send(snapshot.val());}
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send();
        });
    });

    app.post('/PDF_obras', fileUpload(), function (req, res) {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const form_size = req.body.formData_size
        const obra = req.body.formData_obra
        const date = req.body.formData_date
        let promises = [];
        for (let i = 1; i <= form_size; i++) {
            const params = JSON.parse(req.body[`formData_${i}`])
            const pdfObra = new PdfObra(params.uid, obra, date, params, user_uid, "PDF/", (req.files != null && req.files != undefined) ? req.files[`uploadedFile_${i}`] : undefined, new_bucket)
            console.log("uid Obra: ", pdfObra.uidObra);
            console.log("uid: ", pdfObra.uid);
            let p = new Promise((resolve, reject) => {
                if(pdfObra.activity == "remove"){
                    removeInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}`)
                    .then(() => {
                        try{
                            new_bucket.file(`PDF/${pdfObra.uidObra}/${pdfObra.uid}/some.pdf`).delete();
                        }catch(e){
                            reject(e);
                        }
                    })
                    .then(resolve)
                    .catch((e) => {
                        console.log(e);
                        reject(e);
                    })
                }
                else if (pdfObra.activity == "status"){
                    uploadInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}/history/${pdfObra.history_uuid}`, pdfObra.firebaseObj, false)
                    .then(uploadInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}`, pdfObra.firebaseObj, false))
                    // .then(() => {
                    //     if(pdfObra.status == "ativo") setInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/ativo`, pdfObra.uid, false)
                    // })
                    .then(resolve)
                    .catch((e) => {
                        console.log(e);
                        reject(e);
                    })
                }
                else{
                    pdfObra.setCreation();
                    uploadPDF(new_bucket, pdfObra.uid, pdfObra.pdf)
                    .then(uploadInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}`, pdfObra.firebaseObj, false))
                    // .then(() => {
                    //     if(pdfObra.status == "ativo") setInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/ativo`, pdfObra.uid, false)
                    // })
                    .then(resolve)
                    .catch((e) => {
                        console.log(e);
                        reject(e);
                    })
                }
            });
            promises.push(p);
        }
        Promise.all(promises)
        .then(() => {
            res.status(200).send();
        }).catch((e) => {
            console.log(e);
            res.status(507).send();
        })
    });
}