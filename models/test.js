app.get('/oi', (req, res) => {
    console.log("/oi\n"+req.sessionID+"\n")
    res.send({"result": "Server Online"});
});