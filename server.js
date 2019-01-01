var express = require("express");
var app = express();
var path = require("path");
var morgan = require("morgan");
var querystring = require("query-string");
var request = require("request");
var {scopes, redirectURI, clientId, secret} = require("./config.js");

app.use(morgan("dev"));
app.use(express.static(path.resolve(__dirname)));

app.get("/app", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/auth", function(req, res) {
    //get refresh and access tokens
    let params = {
        url: "https://accounts.spotify.com/api/token",
        form: {
            grant_type: "authorization_code",
            code: req.query.code,
            redirect_uri: redirectURI
        },
        headers: {
            "Authorization": "Basic " + (new Buffer(clientId + ":" + secret)).toString("base64")
        },
        json: true
    }

    request.post(params, function(err, resp, body) {
        if (!err) {
            let at = body.access_token;
            let rt = body.refresh_token;
            console.log(body);
            res.redirect("/app?rt=" + rt + "&at=" + at);
        }
    });
});

app.get("/", function(req, res) {
    //redirect to get user permission
    let params = querystring.stringify({
        response_type: "code",
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectURI
    });
    res.redirect("https://accounts.spotify.com/authorize?" + params);
});

app.listen(8080);

