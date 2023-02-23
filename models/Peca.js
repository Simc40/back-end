const crypto = require('crypto');         // Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

class Peca{
    constructor(clientAcronimo, obraAcronimo, obra, elemento, nome_peca, num , user){
        let attr = {};
        this.uid = crypto.randomUUID();
        attr.uid = this.uid;
        attr.elemento = elemento;
        let date = new Date().toDateString();
        attr.etapa_atual = "armacao";
        attr.etapas = {}
        attr.etapas.cadastro = {
            checklist: "",
            createdBy: user,
            creation: date
        }
        attr.lastModifiedBy = user;
        attr.lastModifiedOn = date;
        attr.nome_peca = nome_peca + "-" + num;
        attr.num = num.toString();
        attr.obra = obra;
        attr.qrCode = clientAcronimo + "-" + obraAcronimo + "-" + num;
        attr.tag = "";
        this.firebaseObj = attr;
    }
}

module.exports = {Peca};