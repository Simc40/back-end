const crypto = require('crypto');         
const { PdfFile } = require('./PdfFile');

class PdfElemento{
    constructor(uid, uidObra, uidElemento, date, attr, userId, destPdfName, PDF, bucket){
        if(uid == undefined || uid == null) this.uid = crypto.randomUUID();
        else this.uid = uid;
        this.uidObra = uidObra;
        this.uidElemento = uidElemento;
        this.history_uuid = crypto.randomUUID();
        this.date = date;
        this.userId = userId;
        this.status = attr.status;
        this.activity = attr.activity;
        delete attr.activity;
        attr.obra = this.uidObra;
        attr.elemento = this.uidElemento;
        attr.lastModifiedBy = userId;
        attr.lastModifiedOn = date;
        if(PDF != undefined){
            destPdfName = destPdfName + this.uidObra + "/" + this.uidElemento + "/" + this.uid + "/";
            this.pdf = new PdfFile(PDF, destPdfName, bucket);
            attr.pdfUrl = this.pdf.getPdfUrl(this.uid);
        }
        this.firebaseObj = attr;
    }

    setCreation(){
        this.firebaseObj.uid = this.uid;
        this.firebaseObj.creation = this.date;
        this.firebaseObj.createdBy = this.userId;
        this.firebaseObj = Object.assign({}, {"history": { [this.history_uuid]: this.firebaseObj } }, this.firebaseObj);
    }
}

module.exports = {PdfElemento};