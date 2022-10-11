const crypto = require('crypto');         
const { PdfFile } = require('./PdfFile');

class PdfObra{
    constructor(uid, uidObra, date, attr, userId, destPdfName, PDF, bucket){
        if(uid == undefined || uid == null) this.uid = crypto.randomUUID();
        else this.uid = uid;
        this.uidObra = uidObra;
        this.history_uuid = crypto.randomUUID();
        this.date = date;
        this.userId = userId;
        this.status = attr.status;
        this.activity = attr.activity;
        delete attr.activity;
        attr.obra = this.uidObra;
        attr.lastModifiedBy = userId;
        attr.lastModifiedOn = date;
        if(PDF != undefined){
            destPdfName = destPdfName + this.uidObra + "/" + this.uid + "/";
            this.pdf = new PdfFile(PDF, destPdfName, bucket);
            attr.pdfUrl = this.pdf.getPdfUrl(this.uid);
        }
        this.firebaseObj = attr;
    }

    setCreation(){
        this.firebaseObj.creation = this.date;
        this.firebaseObj.createdBy = this.userId;
        this.firebaseObj = Object.assign({}, {"history": { [this.history_uuid]: this.firebaseObj } }, this.firebaseObj);
    }
}

module.exports = {PdfObra};