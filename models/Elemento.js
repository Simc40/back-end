const crypto = require('crypto');         // Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

class Elemento{
    constructor(uidObra, uid, attr, userId, creation, splitHistory){
        this.uidObra = uidObra;
        if(uid == undefined) this.uid = crypto.randomUUID()
        else this.uid = uid;
        this.history_uuid = crypto.randomUUID()
        let date = attr.date
        delete attr.date
        attr.uid = this.uid;
        attr.lastModifiedBy = userId;
        attr.lastModifiedOn = date;
        if(creation){
            attr.numPecas = "0"
            attr.creation = date;
            attr.createdBy = userId;
        }
        if(!splitHistory){
            attr = Object.assign({}, {"history": { [this.history_uuid]: attr } }, attr)
        }
        this.firebaseObj = attr;
    }

    toString = function () {
        return this.firebaseObj;
    };
}

module.exports = {Elemento};