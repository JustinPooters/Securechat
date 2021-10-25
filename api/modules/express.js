const e = require("express");
const express = require("express");
require('dotenv').config();
const serverport = 3009;
const app = express();
const bodyParser = require('body-parser')
const mysql = require('mysql');
const crypto = require("crypto");
const algorithm = 'aes-256-ctr';
const password = process.env.CRYPTPASS;
const key = crypto.scryptSync(password, 'salt', 32);
const initVector = crypto.randomBytes(16);
const Securitykey = crypto.randomBytes(32);
const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);


function expressserver() {

    // EXPLAINATION: load database
    var con = mysql.createConnection({
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASS,
        database: process.env.DBNAME
    });

    con.connect();
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/test', function(req, res) {
        res.send(200, Date.now());
    });
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

    app.post('/1/sendmessage', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            if (!req.body.message || !req.body.userid) {
                return res.send(400, 'No message provided.');
            } else {
                let userid = req.body.userid;
                con.query("SELECT * FROM users WHERE ID=" + userid, function(err, result, fields) {
                    if (err) throw err;
                    if (result.length == 0) {
                        return res.send(400, 'No user found with that ID.');
                    } else {
                        let message = req.body.message;
                        con.query("INSERT INTO messages (timestamp, message, author) VALUES ('" + Date.now() + "'," + message + "', " + userid + ")", function(err, result, fields) {
                            if (err) throw err;
                            res.send(200, 'Message sent.');
                        });
                    }
                });
            }
        }
    });

    app.post('/1/createuser', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            if (!req.body.username || !req.body.password) {
                return res.send(400, 'No username or password provided.');
                // return res.send(400, req.body);
            } else {
                let username = req.body.username;
                let password = req.body.password;
                let encryptedpassword = cipher.update(password, 'utf8', 'hex');
                encryptedpassword += cipher.final('hex');
                let returnjson = `{"username": "${username}","password": "${encryptedpassword}"}`;
                con.query("SELECT * FROM users WHERE username=" + "'" + username + "'", function(err, result, fields) {
                    if (err) throw err;
                    if (result.length == 0) {
                        con.query("INSERT INTO users (username, password, created) VALUES ('" + username + "', '" + encryptedpassword + "', '" + Date.now() + "')", function(err, result, fields) {
                            if (err) throw err;
                            res.send(200, returnjson);
                        });
                    } else {
                        return res.send(400, 'Username already taken.');
                    }
                });
            }
        }
    });

    app.listen(serverport, () => {
        console.log(`Server listening on port ${serverport}`);
    });

}
module.exports = {
    load: expressserver
}