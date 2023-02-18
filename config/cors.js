//Configure Cross-Origin Resource Sharing (CORS)
const corsOptions = {
  origin: "*",
  // origin: [
  //   "http://localhost:8000",
  //   "http://localhost:8001",
  //   "http://192.168.0.2:8000",
  // ],
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

exports.corsOptions = corsOptions;
