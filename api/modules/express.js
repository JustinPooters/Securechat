function express() {

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
modules.export = {
    load: express
}