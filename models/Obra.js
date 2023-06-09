const crypto = require('crypto');         // Crypto for generatin Random UUIDs//const uuid = crypto.randomUUID();

class Obra{
    constructor(uid, attr, userId, creation, splitHistory){
        if(uid == undefined) this.uid = crypto.randomUUID()
        else this.uid = uid;
        this.history_uuid = crypto.randomUUID()
        let date = attr.date
        delete attr.date
        attr.uid = this.uid;
        attr.lastModifiedBy = userId;
        attr.lastModifiedOn = date;
        if(creation){
            attr.creation = date;
            attr.createdBy = userId;
            attr.checklist = checklist;
        }
        if(!splitHistory){
            attr = Object.assign({}, {"history": { [this.history_uuid]: attr } }, attr)
        }
        this.firebaseObj = attr;
    }
}

const checklist = {
    "armacao": "45295602-b4e6-4baf-a855-539bd4f3ea89",
    "armacaoForma": "11e5a2d5-3c7c-4efd-81b3-fd3edca7d49d",
    "cadastro": "f46f5c20-f57a-4645-b36d-834c08e79c2f",
    "carga": "3807d607-86dd-448a-9c91-94d973d6cff9",
    "concretagem": "68faa799-3cd0-47ed-b8b8-30d61c47f089",
    "descarga": "1e193841-e1d9-4f70-8d7b-66dc157e5c71",
    "forma": "c586679b-c229-4a67-b467-b823100c6b3c",
    "history": {
        "armacao": {
        "45295602-b4e6-4baf-a855-539bd4f3ea89": {
            "0": "Bitola",
            "1": "Espaçadores",
            "2": "Espaçamento",
            "3": "Quantidade de Barras e Estribos",
            "4": "Alça de Içamento",
            "5": "Amarração das Barras",
            "6": "Teste",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "25/08/2022 22:28:23"
        },
        "fe5ed92b-81d4-4e99-8a40-f2b91fac331c": {
            "0": "Bitola",
            "1": "Espaçadores",
            "2": "Espaçamento",
            "3": "Quantidade de Barras e Estribos",
            "4": "Alça de Içamento",
            "5": "Amarração das Barras",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "25/08/2022 22:27:45"
        }
        },
        "armacaoForma": {
        "11e5a2d5-3c7c-4efd-81b3-fd3edca7d49d": {
            "0": "Cobrimento",
            "1": "SPDA",
            "2": "Inserts",
            "3": "Tubo de Água Pluvial",
            "4": "Chumbador",
            "5": "Furo de Passagem",
            "6": "Barra de Montagem",
            "7": "Sem Avarias Devido a Içamento",
            "8": "Alça de Içamento",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "cadastro": {
        "f46f5c20-f57a-4645-b36d-834c08e79c2f": {
            "0": "Defeito na tag",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "carga": {
        "3807d607-86dd-448a-9c91-94d973d6cff9": {
            "0": "Identificação da Peça",
            "1": "Inspeção visual do Carregamento",
            "2": "Checagem da ordem de carga",
            "3": "Nota Fiscal",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "concretagem": {
        "68faa799-3cd0-47ed-b8b8-30d61c47f089": {
            "0": "Exsudação",
            "1": "Vazios de Concretagem",
            "2": "Cura",
            "3": "Estanqueidade de Forma",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "descarga": {
        "1e193841-e1d9-4f70-8d7b-66dc157e5c71": {
            "0": "Ordem da Carga",
            "1": "Identificação",
            "2": "Integridade da Peça",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "forma": {
        "c586679b-c229-4a67-b467-b823100c6b3c": {
            "0": "Dimensão da Forma",
            "1": "Travamento da Forma",
            "2": "Nivelamento da Forma",
            "3": "Alinhamento da Forma",
            "4": "Integridade de Forma",
            "5": "Desmoldante",
            "6": "Posição dos Consoles na Forma",
            "7": "Sem Avarias Devido a Içamento",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "liberacao": {
        "7168a5f5-51d5-4ddb-aa42-e37866988ab7": {
            "0": "Lixamento",
            "1": "Uniformidade",
            "2": "Espessura do Estuque",
            "3": "Etiqueta",
            "4": "Dimensões da Peça",
            "5": "Prumo da Peça",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "montagem": {
        "5914bcf8-4475-401c-a76b-e175dc09d975": {
            "0": "Nível",
            "1": "Prumo",
            "2": "Posição de console",
            "3": "Solidarização",
            "4": "Apoio de ligação",
            "5": "Tolerância de folga",
            "6": "Estabilidade",
            "7": "Alinhamento",
            "8": "Desobstrução de furos",
            "9": "Outros",
            "10": "Afasf",
            "11": "Gasgasgasg",
            "12": "Ahahf",
            "13": "Aadfhdfh",
            "14": "Adfhfdah",
            "15": "Dfahafdh",
            "16": "Dafhadfh",
            "17": "Afdanfh",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "26/08/2022 10:48:41"
        },
        "d77c9065-d23c-4705-896a-f5f19d052630": {
            "0": "Nível",
            "1": "Prumo",
            "2": "Posição de console",
            "3": "Solidarização",
            "4": "Apoio de ligação",
            "5": "Tolerância de folga",
            "6": "Estabilidade",
            "7": "Alinhamento",
            "8": "Desobstrução de furos",
            "9": "Outros",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        },
        "planejamento": {
        "7e624c9c-857f-4f45-b43e-2981a1ead201": {
            "0": "Inconsistência no número de peças planejadas",
            "1": "Inconsistência de medidas",
            "2": "Modelo associado está incorreto",
            "createdBy": "75A72HK1Q1WltVcAPNROtZg8uN02",
            "creation": "16/07/2022 15:26:56"
        }
        }
    },
    "liberacao": "7168a5f5-51d5-4ddb-aa42-e37866988ab7",
    "montagem": "5914bcf8-4475-401c-a76b-e175dc09d975",
    "planejamento": "7e624c9c-857f-4f45-b43e-2981a1ead201"
    
}

module.exports = {Obra};