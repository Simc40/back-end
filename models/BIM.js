const crypto = require('crypto');         // Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

class BIM{
    constructor(uidObra, attr, userId, creation, splitHistory){
        this.uidObra = uidObra;
        this.history_uuid = crypto.randomUUID()
        let date = attr.date
        delete attr.date
        attr.obra = this.uidObra;
        attr.lastModifiedBy = userId;
        attr.lastModifiedOn = date;
        if(creation){
            attr.creation = date;
            attr.createdBy = userId;
        }
        if(!splitHistory){
            attr = Object.assign({}, {"history": { [this.history_uuid]: attr } }, attr)
        }
        this.firebaseObj = attr;
    }
}

module.exports = {BIM};