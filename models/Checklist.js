const crypto = require('crypto');         // Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

class Checklist{
    constructor(etapa, attr, userId){
        this.etapa = etapa;
        this.history_uuid = crypto.randomUUID()
        let date = attr.date;
        this.obra = attr.obra;
        delete attr.obra;
        delete attr.date;
        attr.creation = date;
        attr.createdBy = userId;
        this.firebaseObj = attr;
    }
}

module.exports = {Checklist};