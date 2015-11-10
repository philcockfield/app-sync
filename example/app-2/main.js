var express = require("express");
var argv = require("minimist")(process.argv.slice(2));
var app = express();
var packageJson = require("./package.json");
var name = packageJson.name;


var count = 0;
app.get("*", function(req, res) {
  count += 1;
  res.send("<code>" + name + "@" + packageJson.version + ": Loaded: " + count + "</code>");
});




var PORT = argv.port || 5000;
console.log("Starting App-2");
app.listen(PORT, function() {
    console.log(name + " listening on port:", PORT);
    console.log("");
});
