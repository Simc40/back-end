const admin = require("firebase-admin");
const { setInRealTimeDatabase } = require("../models/firebaseDatabase");

module.exports = function (app, sessions_map, get_database) {
  app.get("/planejamento", (req, res) => {
    const new_db = get_database(
      sessions_map.get(req.sessionID).cliente.database
    );
    let ref = admin.database(new_db).ref("planejamentoBIM");
    ref.once(
      "value",
      (snapshot) => {
        if (snapshot.val() == null) res.status(204).send();
        else {
          res.status(200).send(snapshot.val());
        }
      },
      (errorObject) => {
        console.log("The read failed: " + errorObject.name);
        res.status(507).send();
      }
    );
  });

  app.post("/planejamento", (req, res) => {
    const new_db = get_database(
      sessions_map.get(req.sessionID).cliente.database
    );
    const activity = req.body.params.activity;
    const obra = req.body.params.obra;
    const nome_peca = req.body.params.nome_peca;
    const startOrEnd = req.body.params.startOrEnd;
    const date = req.body.params.date;

    setInRealTimeDatabase(
      new_db,
      `planejamentoBIM/${obra}/${activity}/${nome_peca}/${startOrEnd}`,
      date,
      false
    )
      .then(() => {
        res.status(200).send();
      })
      .catch((e) => {
        console.log(e);
        res.status(507).send();
      });
  });
};
