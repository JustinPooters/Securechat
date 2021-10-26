const e = require("express");
const express = require("express");
require('dotenv').config();
const serverport = 3009;
const app = express();
const bodyParser = require('body-parser')
const mysql = require('mysql');
const crypto = require("crypto");
const { resourceLimits } = require("worker_threads");
const { CONNREFUSED } = require("dns");
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
                res.send(200, result);
            });
        }
    });

    app.get('/1/getchannelmessages', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            if (!req.body.channelid) {
                res.send(400, 'Missing channelid');
            } else {
                con.query(`SELECT * FROM messages WHERE channelid=${req.body.channelid}`, function(err, result, fields) {
                    if (err) throw err;
                    res.send(200, result);
                });
            }
        }
    });

    app.post('/1/createchannel', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            let channelname = req.body.channelname;
            let userid = req.body.userid;
            if (!channelname) {
                res.send(400, 'No channel name is given.');
            } else {
                con.query("INSERT INTO channels (name) VALUES ('" + channelname + "')", function(err, result, fields) {
                    if (err) throw err;
                    con.query("SELECT * FROM channels WHERE name = '" + channelname + "' ORDER BY id DESC LIMIT 1", function(err, result, fields) {
                        let channelid = result[0].id;
                        con.query("INSERT INTO channelpermissions (channelid, userid) VALUES ('" + channelid + "','" + userid + "')", function(err, result, fields) {
                            if (err) throw err;

                            res.send(200, 'Channel created succesfully');
                        });

                    });
                });
            }
        }
    });

    app.post('/1/sendmessage', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            if (!req.body.message || !req.body.userid || !req.body.channelid) {
                return res.send(400, 'No message, userid or channel provided.');
            } else {
                let userid = req.body.userid;
                con.query("SELECT * FROM users WHERE ID=" + userid, function(err, result, fields) {
                    if (err) throw err;
                    if (result.length == 0) {
                        return res.send(400, 'No user found with that ID.');
                    } else {
                        let message = req.body.message;
                        let channelid = req.body.channelid
                        con.query("SELECT * FROM channels WHERE ID=" + channelid, function(err, result, fields) {
                            if (err) throw err;
                            if (result.length == 0) {
                                return res.send(400, 'No channel found with that ID.');
                            } else {
                                con.query(`SELECT * FROM channelpermissions where channelid=${channelid} AND userid=${userid}`, function(err, result, fields) {
                                    if (err) throw err;
                                    if (result.length == 0) {
                                        return res.send(400, 'You are not allowed to send messages to this channel.');
                                    } else {
                                        con.query("INSERT INTO messages (timestamp, message, author, channelid) VALUES ('" + Date.now() + "','" + message + "','" + userid + "','" + channelid + "')", function(err, result, fields) {
                                            if (err) throw err;
                                            res.send(200, 'Message sent succesfully');
                                        });
                                    }
                                });
                            }
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
                console.log(password);
                let encryptedpassword = cipher.update(password, 'utf8', 'hex');
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

    app.post('/1/addchanneluser', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            if (!req.body.userid || !req.body.channelid) {
                return res.send(400, 'No userid or channelid provided.');
            } else {
                let userid = req.body.userid;
                let channelid = req.body.channelid;
                con.query("SELECT * FROM users WHERE ID=" + userid, function(err, result, fields) {
                    if (err) throw err;
                    if (result.length == 0) {
                        return res.send(400, 'No user found with that ID.');
                    } else {
                        con.query("SELECT * FROM channels WHERE ID=" + channelid, function(err, result, fields) {
                            if (err) throw err;
                            if (result.length == 0) {
                                return res.send(400, 'No channel found with that ID.');
                            } else {
                                con.query("SELECT * FROM channelpermissions WHERE channelid=" + channelid + " AND userid=" + userid, function(err, result, fields) {
                                    if (err) throw err;
                                    if (result.length == 0) {
                                        con.query("INSERT INTO channelpermissions (channelid, userid) VALUES ('" + channelid + "','" + userid + "')", function(err, result, fields) {
                                            if (err) throw err;
                                            res.send(200, 'User added to channel.');
                                        });
                                    } else {
                                        return res.send(400, 'User already in channel.');
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });

    app.post('/1/removechanneluser', function(req, res) {
        let getapiheader = req.get('x-api-key');
        if (!getapiheader || getapiheader != process.env.APIKEY) {
            res.send(401, 'Not Authorized.');
        } else {
            if (!req.body.userid || !req.body.channelid) {
                return res.send(400, 'No userid or channelid provided.');
            } else {
                let userid = req.body.userid;
                let channelid = req.body.channelid;
                con.query("SELECT * FROM users WHERE ID=" + userid, function(err, result, fields) {
                    if (err) throw err;
                    if (result.length == 0) {
                        return res.send(400, 'No user found with that ID.');
                    } else {
                        con.query("SELECT * FROM channels WHERE ID=" + channelid, function(err, result, fields) {
                            if (err) throw err;
                            if (result.length == 0) {
                                return res.send(400, 'No channel found with that ID.');
                            } else {
                                con.query("SELECT * FROM channelpermissions WHERE channelid=" + channelid + " AND userid=" + userid, function(err, result, fields) {
                                    if (err) throw err;
                                    if (result.length == 0) {
                                        return res.send(400, 'User not in channel.');
                                    } else {
                                        con.query("DELETE FROM channelpermissions WHERE channelid=" + channelid + " AND userid=" + userid, function(err, result, fields) {
                                            if (err) throw err;
                                            res.send(200, 'User removed from channel.');
                                        });
                                    }
                                });
                            }
                        });
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