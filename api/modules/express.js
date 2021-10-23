const express = require("express");
require('dotenv').config();
const serverport = 3009;
const app = express();
const mysql = require('mysql');

function expressserver() {

    // EXPLAINATION: load database
    var con = mysql.createConnection({
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASS,
        database: process.env.DBNAME
    });

    con.connect();
    app.get('/1/messages', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            con.query("SELECT * FROM messages", function(err, result, fields) {
                if (err) throw err;
                console.log(result);
                res.send(200, result);
            });
        }


    });

    app.listen(serverport, () => {
        console.log(`Server listening on port ${serverport}`);
    });

}
module.exports = {
    load: expressserver
}