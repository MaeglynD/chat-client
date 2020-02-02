var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '[REDACTED]',
    database: '[REDACTED]'
});

// return html view
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
})

let userhash = 1;

// connect to database
con.connect((err) => {
    if(err) throw err;

    io.on('connection', (socket) => {

        socket.userhash = userhash++;

        // GET ALL PREVIOUS MESSAGES (init)
        con.query('SELECT * FROM messages', (err, result) => {
            if (err) throw err;
            socket.emit('init', result);
        });

        // CONNECT
        io.emit('userconnect', socket.userhash);

        // DISCONNECT
        socket.on('disconnect', () => {
            io.emit('userdisconnect', socket.userhash);
        });

        // MESSAGE
        socket.on('msg', (msg, date) => {
            con.query(`INSERT INTO messages (unix, user_id, message) VALUES (${con.escape(date)}, ${socket.userhash}, "${con.escape(msg)}")`);
            io.emit('msg', msg, date, socket.userhash);

        })
    })

    http.listen(3000, () => {
        console.log('Listening');
    })
})

