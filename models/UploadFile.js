async function uploadFile(bucket, uid, image) {
    return new Promise((resolve, reject) => {
        bucket.upload(image.filePath, {
            destination: image.destImageName,
            metadata: {
                // "custom" metadata:
                metadata: {
                    firebaseStorageDownloadTokens: uid, // Can technically be anything you want
                },
            }}
        ).then(() => {
            console.log("resolveUpload")
            resolve()
        }).catch((e) => {
            reject(e)
        })
    })
}

async function uploadPDF(bucket, uid, PDF) {
    console.log("bucket dest: " + PDF.destPdfName)
    return new Promise((resolve, reject) => {
        bucket.upload(PDF.filePath, {
            destination: PDF.destPdfName,
            metadata: {
                // "custom" metadata:
                metadata: {
                    firebaseStorageDownloadTokens: uid, // Can technically be anything you want
                },
            }}
        ).then(() => {
            console.log("resolveUpload")
            resolve()
        }).catch((e) => {
            reject(e)
        })
    })
}

module.exports = {uploadFile, uploadPDF}