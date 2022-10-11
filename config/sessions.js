const session_key = '0f0c9ee8-efb3-4637-89f6-9f3e0490f108';               // Session Key
const oneDay = 1000 * 60 * 60 * 24;                                       // creating 24 hours from milliseconds

const sessionConfig = {
    name: "back_end",
    secret: session_key,
    saveUninitialized:true,
    cookie: { maxAge: oneDay, sameSite: 'strict', secure: false},
    resave: false,
};

let sessions_map = new Map();                                             // HashMap for storing values

//SETTING UP MIDDLEWARE
function sessionTokenMiddleware (req, res, next) {
    let url = req._parsedUrl.pathname
    console.log(url+"\n"+req.sessionID)
    let permitedUrls = ["/", "/login", "/check-session","/logout", "/forget_password"]
    if(permitedUrls.includes(url)){
      next()
      return
    }
    let user = sessions_map.get(req.sessionID)
    if(user == undefined){
      res.status(204).send()
      return
    }
    next()
}


module.exports = {sessionConfig, sessions_map, sessionTokenMiddleware}