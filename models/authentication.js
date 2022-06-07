app.get('/login', (req, res) => {
    let email = req.query.email;
    let password = req.query.password;
    console.log("/login\n"+req.sessionID+"\n")
    const step1 = "User Login"
    const step2 = "Get client from user in `usuarios/${uid_user}/cliente`"
    const step3 = "Get client database in `clientes/${cliente_uid}/database`"
    firebaseAuth.signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
      // Signed in
      let uid = userCredential.user.uid
      let ref = db.ref(`usuarios/${uid}/cliente`);
  
      //Step2
      ref.once('value').then(function (snapshot){
        return snapshot.val()
      })
      //Step3
      .then(function(cliente_uid){
      let ref = db.ref(`clientes/${cliente_uid}/database`);
      ref.once('value').then(function (snapshot){
        return snapshot.val()
      })
      //Step4
      .then(function(database_cliente){
        save_session(req.sessionID, {"uid": uid, "database":database_cliente})
        res.send(db_success)
        })
      }).catch((error)=>{
        //Throw error Step3
        console.log("Error in: " + step3 + "\n" + error + "\n")
        res.send(db_error(103));
      })
  
    }).catch((error) => {
        if(error.name == "FirebaseError") {
          //Throw error Step 1
          console.log("Error in: " + step1 + "\n" + error + "\n")
          console.log(error.code)
          res.send(error)
          return
        }
        //Throw error Step 2
        console.log("Error in: " + step2 + "\n" + error + "\n")
        res.send(db_error(102));        
    });
  });
  
  function save_session(sessionID, user){
    if(!sessions_map.has(sessionID)){
      sessions_map.set(sessionID, user);
    }
  }