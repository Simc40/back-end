const firebaseAuth = require("firebase/auth");
const auth = firebaseAuth.getAuth();                                                                // Constant for using Firebase Authentincation Functions

module.exports = function (app) {

    app.post('/reset_password', (req, res) => {
        let email = req.body.email
        firebaseAuth.sendPasswordResetEmail(auth, email, null)
        .then(() => {
            res.status(200).send()
        })
        .catch(function (error) {
            // Error occurred. Inspect error.code.
            console.log(error)
            res.status(403).send({ "error": error.code })
        });
    })
}
