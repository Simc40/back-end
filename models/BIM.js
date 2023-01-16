const crypto = require('crypto');         // Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

class BIM{
    constructor(urn, nome_forge, attr, userId, date, creation, splitHistory){
        this.uidObra = attr.obra;
        if(attr.uid == undefined || attr.uid == null) {
            this.uid = crypto.randomUUID();
            attr.uid = this.uid;
        }
        if (urn != undefined) attr.urn = urn;
        this.activity = attr.activity;
        delete attr.activity;
        this.history_uuid = crypto.randomUUID()
        this.date = date
        attr.nome_forge = nome_forge;
        attr.lastModifiedBy = userId;
        attr.lastModifiedOn = this.date;
        if(creation){
            attr.creation = this.date;
            attr.createdBy = userId;
        }
        if(!splitHistory){
            attr = Object.assign({}, {"history": { [this.history_uuid]: attr } }, attr)
        }
        this.firebaseObj = attr;
    }
}

module.exports = {BIM};