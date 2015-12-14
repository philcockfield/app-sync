var express = require("express");
var argv = require("minimist")(process.argv.slice(2));
var packageJson = require("./package.json");
var name = packageJson.name;


var app = express();
app.use(express.static(__dirname + "/images"));



// Kills the process so we can test PM2 restarting the app.
app.get("/kill", function(req, res) {
  process.exit(0);
});



var count = 0;
app.get("*", function(req, res) {
    count += 1;
    var html = "";
    html += "<code>" + name + "@" + packageJson.version + ": Loaded: " + count + "</code><hr/>";
    html += "<img src='/moon.jpg' />";
    res.send(html);
});



var PORT = argv.port || 5000;
console.log("Starting App-2");
app.listen(PORT, function() {
    console.log(name + " listening on port:", PORT);
    console.log("");
});
