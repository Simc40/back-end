const admin = require("firebase-admin");                              // Import Firebase-admin for realtime-database
const rootFirebaseDatabaseNode = "root";

function uploadInRealTimeDatabase(db, path, data, defaultDB){
    return new Promise((resolve, reject) => {
        try{
            let ref;
            if(defaultDB) {
                if(path == rootFirebaseDatabaseNode) ref = db.ref()
                else ref = db.ref(path) 
            }
            else {
                if(path == rootFirebaseDatabaseNode) ref = admin.database(db).ref();
                else ref = admin.database(db).ref(path);
            }
            if(path == "root"){
                ref.set(data).then(function () {
                    resolve()
                }).catch(function (error) {
                    reject(error)
                });
            }else{
                ref.update(data).then(function () {
                    resolve()
                }).catch(function (error) {
                    reject(error)
                });
            }
        } catch(error){
            reject(error)
        }
    });
}

function setInRealTimeDatabase(db, path, data, defaultDB){
    return new Promise((resolve, reject) => {
        try{
            let ref;
            if(defaultDB) {
                if(path == rootFirebaseDatabaseNode) ref = db.ref()
                else ref = db.ref(path) ;
            }
            else {
                if(path == rootFirebaseDatabaseNode) ref = admin.database(db).ref();
                else ref = admin.database(db).ref(path);
            }
            ref.set(data).then(function () {
                resolve();
            }).catch(function (error) {
                reject(error);
            });
        } catch(error){
            reject(error);
        }
    });
}

function removeInRealTimeDatabase(db, path){
    return new Promise((resolve, reject) => {
        try{
            let ref;
            ref = admin.database(db).ref(path);
            ref.remove().then(function () {
                resolve();
            }).catch(function (error) {
                reject(error);
            });
        } catch(error){
            reject(error);
        }
    });
}


module.exports = {setInRealTimeDatabase, uploadInRealTimeDatabase, removeInRealTimeDatabase, rootFirebaseDatabaseNode};