//Configure Cross-Origin Resource Sharing (CORS)
const corsOptions = {
    origin: '*',
    // origin: 'http://localhost:8000', 
    credentials:true,                     //access-control-allow-credentials:true
    optionSuccessStatus:200
}

exports.corsOptions = corsOptions;