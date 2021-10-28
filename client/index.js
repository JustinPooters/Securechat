var express = require('express');
var app = express();
app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {
    res.render('pages/index');
});

app.listen(80);
console.log('Server is listening on port 80');