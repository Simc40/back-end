const express = require('express');                                                                             //Import the express dependency
const cors = require('cors');
const path = require('path');                                                                                   // Import the path dependency
const sessions = require('express-session');

const PORT = process.env.PORT || 3000;                                                                          // Save the port number where your server will be listening

const { defaultApp, db, get_database } = require('./config/firebaseConfig.js');
const { corsOptions } = require('./config/cors.js');
const { sessionConfig, sessions_map, sessionTokenMiddleware } = require('./config/sessions.js');

let app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use(express.json({ limit: '50mb' }));

app.use(cors(corsOptions));                                                                                     // Configure Cors
app.use(sessions(sessionConfig));                                                                               // Configure Session middleware

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.statusCode).json(err);
});

app.use(sessionTokenMiddleware)

/*Finished Server Configs*/

app.get('/', (_req, res) => {res.send({ "result": "Server Online" });});
require('./routes/session')(app, sessions_map);                                                                 // GET { check-session }
require('./routes/authentication')(app, db, sessions_map);                                                      // POST { login, set-cliente }, GET { logout }
require('./routes/users')(app, defaultApp, db, sessions_map);                                                   // POST { acessos_cadastrar }, PUT{ acessos_gerenciar, acessos_editar } GET { cliente_de_usuario, usuarios_de_cliente, nome_de_usuarios_de_cliente }
require('./routes/permissions')(app, db, sessions_map);                                                         // POST { page_permission }, GET { acessos }
require('./routes/clientes')(app, defaultApp, db, sessions_map, get_database);                                  // POST { cadastrar_cliente }, PUT{ gerenciar_cliente, editar_cliente } GET { clientes }
require('./routes/obras')(app, sessions_map, get_database);                                                     // POST { cadastrar_obras }, PUT{ gerenciar_obras } GET { obras }
require('./routes/transportadoras')(app, sessions_map, get_database);                                           // POST { cadastrar_transportadoras }, PUT{ gerenciar_transportadoras } GET { transportadoras }
require('./routes/veiculos')(app, sessions_map, get_database);                                                  // POST { transportadoras_veiculos_cadastrar }, PUT{ transportadoras_veiculos_gerenciar }
require('./routes/motoristas')(app, defaultApp, sessions_map, get_database);                                    // POST { transportadoras_motoristas_cadastrar }, PUT{ transportadoras_motoristas_gerenciar, transportadoras_motoristas_editar }
require('./routes/galpoes')(app, sessions_map, get_database);                                                   // POST { cadastrar_galpoes }, PUT{ gerenci-ar_galpoes } GET { galpoes }
require('./routes/tiposDePeca')(app, defaultApp, sessions_map, get_database);                                   // POST { tipos_de_peca_cadastrar }, PUT{ tipos_de_peca_gerenciar, tipos_de_peca_editar } GET { tipos_de_peca }
require('./routes/elementos')(app, sessions_map, get_database);                                                 // POST { cadastrar_elementos }, PUT{ gerenciar_elementos } GET { elementos }
require('./routes/checklist')(app, sessions_map, get_database);                                                 // POST { cadastrar_checklist }, PUT{ gerenciar_checklist } GET { checklist }
require('./routes/formas')(app, sessions_map, get_database);                                                    // POST { cadastrar_formas }, PUT{ gerenciar_formas } GET { formas }
require('./routes/pecas')(app, sessions_map, get_database);                                                     // GET { pecas }
require('./routes/erros')(app, sessions_map, get_database);                                                     // GET { erros }
require('./routes/profile')(app, sessions_map, db);                                                             // GET { profile }
require('./routes/romaneios')(app, sessions_map, get_database);                                                 // POST{ romaneio_post }, GET { romaneio_num_carga, romaneio_cargas }
require('./routes/programacao')(app, sessions_map, get_database);                                               // POST{ atualizar_programacao }, GET { programacao }
require('./routes/pdfObras')(app, defaultApp, sessions_map, get_database);                                      // POST { PDF_obras }, GET { PDF }
require('./routes/pdfElementos')(app, defaultApp, sessions_map, get_database);                                  // POST { PDF_elementos }, GET { PDF_elementos }
require('./routes/BIMs')(app, sessions_map, get_database);                                                      // POST { BIM_create_bucket, BIM_create_object }, GET { BIM }
require('./routes/resetPassword')(app);                                                                         // POST { reset_password }

//server starts listening for any attempts from a client to connect at port: {port}
app.listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });