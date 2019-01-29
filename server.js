var express = require("express");
var app = express();
var path = require("path");
var morgan = require("morgan");

app.use(morgan("combined", {
    skip: (req, res) => res.statusCode < 400
}));
app.use(express.static(path.resolve(__dirname)));

//********************************************
// Express Routes
//********************************************

app.get("*", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

app.listen(process.env.PORT || 8080);
