var express = require("express");
var argv = require('minimist')(process.argv.slice(2));
var app = express();
var packageJson = require("./package.json");


var count = 0;
app.get("*", function(req, res) {
  count += 1;
  res.send("<h1>" + packageJson.name + "@" + packageJson.version + ": Loaded: " + count + "</h1>");
});




var PORT = argv.port || 5000;
console.log("Starting App-2");
app.listen(PORT, function() {
    console.log("Listning on port:", PORT);
    console.log("");
});
