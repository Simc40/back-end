const { getPublicToken } = require('../services/aps.js');

module.exports = function(app){
    app.get('/api/auth/token', async function (req, res, next) {
        try {
            res.json(await getPublicToken());
        } catch (err) {
            next(err);
        }
    });
}