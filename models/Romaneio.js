const crypto = require('crypto');         // Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

class Romaneio{
    constructor(uid, attr, userId, creation, splitHistory){
        if(uid == undefined) this.uid = crypto.randomUUID();
        else this.uid = uid;
        this.history_uuid = crypto.randomUUID();
        this.numCarga = attr.romaneio_carga;
        this.uidObra = attr.obra;
        this.pecas = attr.pecas;
        let date = attr.date;
        delete attr.date;
        attr.uid = this.uid;
        attr.lastModifiedBy = userId;
        attr.lastModifiedOn = date;
        if(creation){
            attr.creation = date;
            attr.createdBy = userId;
        }
        if(!splitHistory){
            attr = Object.assign({}, {"history": { [this.history_uuid]: attr } }, attr);
        }
        this.firebaseObj = attr;
    }
}

module.exports = {Romaneio};