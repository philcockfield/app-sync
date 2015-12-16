var express = require("express");
var argv = require("minimist")(process.argv.slice(2));
var app = express();
var packageJson = require("./package.json");
var name = packageJson.name;

var id = Math.floor(Math.random() * 10000);

var count = 0;
app.get("*", function(req, res) {
  count += 1;
  const html = "<code>" + name + "@" + packageJson.version + ": Loaded: " + count + " | id: " + id + "</code><hr/>";
  res.send(html);
});



var PORT = argv.port || 5000;
console.log("Starting App-1");
app.listen(PORT, function() {
    console.log(name + " listening on port:", PORT);
    console.log("");
});
