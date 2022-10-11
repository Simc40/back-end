const crypto = require('crypto');         
const { ImageFile } = require('./ImageFile');

class TipoDePeca{
    constructor(uid, attr, userId, destImageName, firebaseImageKey, bucket, creation, splitHistory){
        if(uid == undefined) this.uid = crypto.randomUUID();
        else this.uid = uid;
        this.history_uuid = crypto.randomUUID();
        let date = attr.date;
        delete attr.date;
        attr.uid = this.uid;
        if(destImageName != undefined) destImageName = destImageName + this.uid + "/";
        this.image = undefined;
        if(attr.image != undefined && attr.image != null) {
            this.image = new ImageFile(attr.image, destImageName, bucket);
            delete attr.image;
            attr[firebaseImageKey] = this.image.getImgUrl(this.uid);
        }
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
    

    hasImage(){
        return this.image != undefined;
    }
}

module.exports = {TipoDePeca};