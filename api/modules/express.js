const express = require("express");
require('dotenv').config();
const serverport = 3009;
const app = express();

function expressserver() {

    app.get('/', function(req, res) {
        con.connect(function(err) {
            if (err) throw err;
            con.query("SELECT * FROM messages", function(err, result, fields) {
                if (err) throw err;
                console.log(results);
            });
        });

    });

    app.listen(serverport, () => {
        console.log(`Server listening on port ${serverport}`);
    });

}
module.exports = {
    load: expressserver
}