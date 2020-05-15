const express = require('express');
const routes = require('./routes/route.js');
const initDb = require("./models/db").initDb;
const config = require('config')
const app = express();
const cache = require('./models/cache');
var bodyParser = require('body-parser');


// PORT
const port = config.get("port");

app.use(bodyParser.json({limit:'50mb'}));

app.use('/api', routes);

initDb(config.get("openbaseDB.connectionUrl"),config.get("openbaseDB.dbName"),config.get("openbaseDB.userColName"),(err)=>{
  if(err){
      console.log(err);
  }
  cache.initCache();
  app.listen(port, ()=>{
      console.log(`Listening on port ${port}...`);
  });
});
