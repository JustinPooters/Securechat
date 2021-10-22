//     _____                           _____ _           _    
//    / ____|                         / ____| |         | |   
//   | (___   ___  ___ _   _ _ __ ___| |    | |__   __ _| |_  
//    \___ \ / _ \/ __| | | | '__/ _ \ |    | '_ \ / _` | __| 
//    ____) |  __/ (__| |_| | | |  __/ |____| | | | (_| | |_  
//   |_____/ \___|\___|\__,_|_|  \___|\_____|_| |_|\__,_|\__| 
//                                                            
//   Secure chat, maintained by Justin P.
//   Github: https://github.com/justinpooters/securechat
//   Twitter: https://twitter.com/justinpooters
//   Website: https://justinp.dev


const express = require("express");
require('dotenv').config();
const figlet = require("figlet")
const serverport = 3009;
const app = express();
var mysql = require('mysql');


//EXPLAINATION: Load database module
const database = require("./modules/database");
database.load();

//EXPLAINATION: Create ASCII art welcome message into the console
console.log(figlet.text("SecureChat"));

// EXPLAINATION: Create the express server
const express = require("./modules/express");
express.load();