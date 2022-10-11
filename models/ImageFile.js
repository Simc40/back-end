const ba64 = require("ba64")

class ImageFile{
    constructor(base64, destImageName, bucket){
        this.extension = ImageFile.convertBase64ToFile(base64)
        this.filePath = "image." + this.extension;
        this.bucketName = bucket.name;
        this.destImageName = destImageName + this.filePath;
    }

    getImgUrl(uid){
        return "https://firebasestorage.googleapis.com/v0/b/" + this.bucketName + "/o/" + encodeURIComponent(this.destImageName) + "?alt=media&token=" + uid;
    }

    static convertBase64ToFile(base64Image) {
        // Save the image synchronously.
        ba64.writeImageSync("image", base64Image); // Saves myimage.jpeg.
        // Or save the image asynchronously.
        ba64.writeImage("image", base64Image, function (err) {
            if (err) throw err;
            console.log("Image saved successfully");
        })
        return ba64.getExt(base64Image)
    }
}




module.exports = {ImageFile}