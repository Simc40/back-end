const formidable = require("express-formidable");
const { BIM } = require("../models/BIM.js");
const { listObjects, uploadObject, translateObject, getManifest, urnify, deleteObject } = require("../services/aps.js");
const { uploadInRealTimeDatabase, removeInRealTimeDatabase, setInRealTimeDatabase } = require("../models/firebaseDatabase");

module.exports = function (app, sessions_map, get_database) {
    app.get("/api/models", async function (req, res, next) {
        try {
            const objects = await listObjects();
            res.json(
                objects.map((o) => ({
                    name: o.objectKey,
                    urn: urnify(o.objectId),
                }))
            );
        } catch (err) {
            next(err);
        }
    });

    app.get("/api/models/:urn/status", async function (req, res, next) {
        try {
            const manifest = await getManifest(req.params.urn);
            if (manifest) {
                let messages = [];
                if (manifest.derivatives) {
                    for (const derivative of manifest.derivatives) {
                        messages = messages.concat(derivative.messages || []);
                        if (derivative.children) {
                            for (const child of derivative.children) {
                                messages.concat(child.messages || []);
                            }
                        }
                    }
                }
                res.json({ status: manifest.status, progress: manifest.progress, messages });
            } else {
                res.json({ status: "n/a" });
            }
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/models", formidable(), async function (req, res, next) {
        // const file = req.files['model-file'];
        // if (!file) {
        //     res.status(400).send('The required field ("model-file") is missing.');
        //     return;
        // }
        // try {
        //     const obj = await uploadObject(file.name, file.path);
        //     await translateObject(urnify(obj.objectId), req.fields['model-zip-entrypoint']);
        //     res.json({
        //         name: obj.objectKey,
        //         urn: urnify(obj.objectId)
        //     });
        // } catch (err) {
        //     next(err);
        // }
        // console.log(req.files);
        // console.log(req.fields);
        // console.log(req.files['model-file']);
        // console.log(req.fields['model-zip-entrypoint']);
        // res.status(200).send();

        const uploadObjectInForge = async (file, name) => {
            try {
                const obj = await uploadObject(name, file.path);
                await translateObject(urnify(obj.objectId), req.fields["model-zip-entrypoint"]);
                return {
                    name: obj.objectKey,
                    urn: urnify(obj.objectId),
                };
            } catch (err) {
                next(err);
            }
        };
        const user_uid = sessions_map.get(req.sessionID).uid;
        const new_db = get_database(sessions_map.get(req.sessionID).cliente.database);
        const form_size = req.fields.formData_size;
        const obra = req.fields.formData_obra;
        const date = req.fields.formData_date;
        let promises = [];
        for (let i = 1; i <= form_size; i++) {
            const params = JSON.parse(req.fields[`formData_${i}`]);
            if (params.activity === "RVT") {
                const file = req.files[`uploadedFile_${i}`];
                const forge_name = obra + "-" + file.name;
                let p = new Promise((resolve, reject) => {
                    uploadObjectInForge(file, forge_name)
                        .then((translate) => new BIM(translate.urn, forge_name, params, user_uid, date, true, false))
                        .then((bim) => uploadInRealTimeDatabase(new_db, `BIM/${bim.uidObra}/${bim.uid}`, bim.firebaseObj, false))
                        .then(resolve)
                        .catch(reject);
                });
                promises.push(p);
            } else if (params.activity === "remove") {
                const uid = params.uid;
                const forge_name = params.nome_rvt;
                let p = new Promise((resolve, reject) => {
                    deleteObject(obra + "-" + forge_name)
                        .then(() => removeInRealTimeDatabase(new_db, `BIM/${obra}/${uid}`))
                        .then(resolve)
                        .catch(reject);
                });
                promises.push(p);
            } else if (params.activity === "status") {
                const uid = params.uid;
                const status = params.status;
                let p = new Promise((resolve, reject) => {
                    setInRealTimeDatabase(new_db, `BIM/${obra}/${uid}/status`, status, false).then(resolve).catch(reject);
                });
                promises.push(p);
            }
            // const pdfObra = new BIM(params.uid, obra, date, params, user_uid, "BIM/", (req.files != null && req.files != undefined) ? req.files[`uploadedFile_${i}`] : undefined, new_bucket)
            // let p = new Promise((resolve, reject) => {
            //     if(pdfObra.activity == "remove"){
            //         removeInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}`)
            //         .then(() => {
            //             try{
            //                 new_bucket.file(`PDF/${pdfObra.uidObra}/${pdfObra.uid}/some.pdf`).delete();
            //             }catch(e){
            //                 reject(e);
            //             }
            //         })
            //         .then(resolve)
            //         .catch((e) => {
            //             console.log(e);
            //             reject(e);
            //         })
            //     }
            //     else if (pdfObra.activity == "status"){
            //         uploadInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}/history/${pdfObra.history_uuid}`, pdfObra.firebaseObj, false)
            //         .then(uploadInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}`, pdfObra.firebaseObj, false))
            //         // .then(() => {
            //         //     if(pdfObra.status == "ativo") setInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/ativo`, pdfObra.uid, false)
            //         // })
            //         .then(resolve)
            //         .catch((e) => {
            //             console.log(e);
            //             reject(e);
            //         })
            //     }
            //     else{
            //         pdfObra.setCreation();
            //         uploadPDF(new_bucket, pdfObra.uid, pdfObra.pdf)
            //         .then(uploadInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/${pdfObra.uid}`, pdfObra.firebaseObj, false))
            //         // .then(() => {
            //         //     if(pdfObra.status == "ativo") setInRealTimeDatabase(new_db, `PDF/${pdfObra.uidObra}/ativo`, pdfObra.uid, false)
            //         // })
            //         .then(resolve)
            //         .catch((e) => {
            //             console.log(e);
            //             reject(e);
            //         })
            //     }
            // });
            // promises.push(p);
        }
        Promise.all(promises)
            .then(() => {
                res.status(200).send();
            })
            .catch((e) => {
                console.log(e);
                res.status(507).send();
            });
    });

    app.delete("/api/models/delete/:name", async function (req, res, next) {
        try {
            await deleteObject(req.params.name);
            res.status(200).send();
        } catch (err) {
            res.status(404).send();
        }
    });
};
