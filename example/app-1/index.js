var express = require("express");
var argv = require('minimist')(process.argv.slice(2));
var app = express();


var count = 0;
app.get("/", function(req, res) {
  count += 1;
  res.send("<h1>Hello World! - " + count + "</h1>");
});


var PORT = argv.port || 5000;
console.log("Starting Sample App");
app.listen(PORT, function() {
    console.log("Listning on port:", PORT);
    console.log("");
});
