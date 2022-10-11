const fs = require('fs')


class PdfFile{
    constructor(pdf, destPdfName, bucket){
        PdfFile.generatePdfFromBuffer(pdf.data);
        this.filePath = "some.pdf";
        this.bucketName = bucket.name;
        this.destPdfName = destPdfName + this.filePath;
    }

    getPdfUrl(uid){
        return "https://firebasestorage.googleapis.com/v0/b/" + this.bucketName + "/o/" + encodeURIComponent(this.destPdfName) + "?alt=media&token=" + uid;
    }

    static generatePdfFromBuffer(buffer) {
        fs.writeFileSync("some.pdf", buffer)
    }
}




module.exports = {PdfFile}