const express = require('express');
const app = express();
//pm2 restart server/index.js
app.use(express.static(__dirname + './../dist/web/')); //serves the index.html
app.listen(3000); //listens on port 3000 -> http://localhost:3000/
