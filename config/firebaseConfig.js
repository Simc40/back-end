const admin = require("firebase-admin");                                                    //Import Firebase-admin for realtime-database
const serviceAccount = require("../simc-iot-firebase-adminsdk-bopry-589a1f03a8.json");      //Import Firebase-admin api-key
const firebase = require("firebase/app");
const firebaseAuth = require("firebase/auth");

//Start Firebase-admin server
const defaultApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://simc-iot-default-rtdb.firebaseio.com",
    storageBucket: "simc-iot.appspot.com"
});
  
const dbucket = defaultApp.storage().bucket();
const db = defaultApp.database();

// Initialize Firebase Configurations
const keys = {
    apiKey: "AIzaSyAHcRmpf7I92tzxMsq72pwqK3n5BwB9Klg",
    authDomain: "simc-iot.firebaseapp.com",
    databaseURL: "https://simc-iot-default-rtdb.firebaseio.com",
    projectId: "simc-iot",
    storageBucket: "simc-iot.appspot.com",
    messagingSenderId: "558911081308",
    appId: "1:558911081308:web:114d4ea9adc511a22a4f99",
    measurementId: "G-KBP29SP75M"
}
  
firebase.initializeApp(keys);

let databases_map = new Map();                                                              // HashMap for storing database apps values

/*************************/
/**** SELECT DATABASE ****/
/*************************/

function get_database(database){
    let db_instace = databases_map.get(database)
    if (db_instace == undefined || db_instace == null){
        const new_db = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: database
        }, database);
        databases_map.set(database, new_db)
        return new_db
    }
    return db_instace
}

module.exports = {dbucket, db, defaultApp, get_database};