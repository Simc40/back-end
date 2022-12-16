const fileUpload = require('express-fileupload');
const admin = require("firebase-admin");                              
const { PdfElemento } = require('../models/PdfElemento');
const { uploadPDF } = require('../models/UploadFile');
const { uploadInRealTimeDatabase , removeInRealTimeDatabase, setInRealTimeDatabase  } = require("../models/firebaseDatabase");

module.exports = function(app, defaultApp, sessions_map, get_database){
    
    app.get('/PDF_elementos', (req, res) => {
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database);
        let ref = admin.database(new_db).ref('PDF_elementos');
        ref.once('value', (snapshot) => {
            if (snapshot.val() == null) res.status(204).send();
            else { res.status(200).send(snapshot.val()); }
        }, (errorObject) => {
            console.log('The read failed: ' + errorObject.name);
            res.status(507).send();
        });
    });

    app.post('/PDF_elementos', fileUpload(), function (req, res) {
        const user_uid = sessions_map.get(req.sessionID).uid
        const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
        const form_size = parseInt(req.body.formData_size)
        const obra = req.body.formData_obra
        const elemento = req.body.formData_elemento
        const date = req.body.formData_date
        let promises = [];
        for (let i = 1; i <= form_size; i++) {
            const params = JSON.parse(req.body[`formData_${i}`])
            const pdfElemento = new PdfElemento(params.uid, obra, elemento, date, params, user_uid, "PDF_elementos/", (req.files != null && req.files != undefined) ? req.files[`uploadedFile_${i}`] : undefined, new_bucket)
            let p = new Promise((resolve, reject) => {
                if(pdfElemento.activity == "remove"){
                    removeInRealTimeDatabase(new_db, `PDF_elementos/${pdfElemento.uidObra}/${pdfElemento.uidElemento}/${pdfElemento.uid}`)
                    .then(() => {
                        try{
                            new_bucket.file(`PDF_elementos/${pdfElemento.uidObra}/${pdfElemento.uidElemento}/${pdfElemento.uid}/some.pdf`).delete();
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
                else if (pdfElemento.activity == "status"){
                    uploadInRealTimeDatabase(new_db, `PDF_elementos/${pdfElemento.uidObra}/${pdfElemento.uidElemento}/${pdfElemento.uid}/history/${pdfElemento.history_uuid}`, pdfElemento.firebaseObj, false)
                    .then(uploadInRealTimeDatabase(new_db, `PDF_elementos/${pdfElemento.uidObra}/${pdfElemento.uidElemento}/${pdfElemento.uid}`, pdfElemento.firebaseObj, false))
                    .then(resolve)
                    .catch((e) => {
                        console.log(e);
                        reject(e);
                    })
                }
                else{
                    pdfElemento.setCreation();
                    uploadPDF(new_bucket, pdfElemento.uid, pdfElemento.pdf)
                    .then(uploadInRealTimeDatabase(new_db, `PDF_elementos/${pdfElemento.uidObra}/${pdfElemento.uidElemento}/${pdfElemento.uid}`, pdfElemento.firebaseObj, false))
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

// app.post('/PDF_elementos', fileUpload(), function (req, res) {
//     const new_db = get_database(sessions_map.get(req.sessionID).cliente.database)
//     const new_bucket = defaultApp.storage().bucket(sessions_map.get(req.sessionID).cliente.storage);
//     let user_uid = sessions_map.get(req.sessionID).uid
//     const form_size = parseInt(req.body.formData_size)
//     const obra = req.body.formData_obra
//     const elemento = req.body.formData_elemento
//     const date = req.body.formData_date
//     for (let i = 1; i <= form_size; i++) {
//         let params = JSON.parse(req.body[`formData_${i}`])
//         const history_uuid = crypto.randomUUID()
//         if (params.activity == "remove") {
//             let ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${params.uid}`);
//             ref.remove().then(function () {
//                 void (0)
//             }).catch(function (error) {
//                 console.log(error)
//                 res.status(507).send()
//             });
//             new_bucket.file("PDF_elementos/" + obra + "/" + elemento + "/" + params.uid + "/some.pdf").delete();
//             continue
//         }
//         if (params.activity == "status") {
//             delete params.activity
//             let history = { [history_uuid]: Object.assign({}, { "lastModifiedBy": user_uid, "lastModifiedOn": date }, params) }
//             let ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${params.uid}/history`);
//             ref.update(history).then(function () {
//                 void (0)
//             }).catch(function (error) {
//                 console.log(error)
//                 res.status(507).send()
//             });
//             ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${params.uid}`);
//             ref.update(params).then(function () {
//                 void (0)
//             }).catch(function (error) {
//                 console.log(error)
//                 res.status(507).send()
//             });
//             if (params.status == "ativo") {
//                 ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/ativo`);
//                 ref.set(params.uid).then(function () {
//                     void (0)
//                 }).catch(function (error) {
//                     console.log(error)
//                     res.status(507).send()
//                 });
//             }
//             continue
//         }
//         delete params.activity
//         const uuid = crypto.randomUUID()
//         const filePath = "some.pdf"
//         let pdf = req.files[`uploadedFile_${i}`]
//         console.log(pdf)
//         generatePdfFromBuffer(pdf.data)
//         const bucketName = new_bucket.name;
//         const destFileName = "PDF_elementos/" + obra + "/" + elemento + "/" + uuid + "/" + filePath;

//         async function uploadFile() {
//             await new_bucket.upload(filePath, {
//                 destination: destFileName,
//                 metadata: {
//                     // "custom" metadata:
//                     metadata: {
//                         firebaseStorageDownloadTokens: uuid, // Can technically be anything you want
//                     },
//                 }
//             })
//             params.pdfUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodeURIComponent(destFileName) + "?alt=media&token=" + uuid
//             history = Object.assign({}, { "lastModifiedBy": user_uid, "lastModifiedOn": date }, params)
//             let new_params = Object.assign({}, { "createdBy": user_uid, "creation": date, "history": { [history_uuid]: history } }, params)
//             let ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/${uuid}`);
//             ref.update(new_params).then(function () {
//                 void (0)
//             }).catch(function (error) {
//                 console.log(error)
//                 res.status(507).send()
//             });
//             if (params.status == "ativo") {
//                 ref = admin.database(new_db).ref(`PDF_elementos/${obra}/${elemento}/ativo`);
//                 ref.set(uuid).then(function () {
//                     void (0)
//                 }).catch(function (error) {
//                     console.log(error)
//                     res.status(507).send()
//                 });
//             }
//         }
//         uploadFile().catch(console.error);
//     }
//     res.status(200).send();
// });