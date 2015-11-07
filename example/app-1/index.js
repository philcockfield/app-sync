// Sample app.
console.log("Sample App");
console.log("process.argv", process.argv);
console.log("");

var express = require("express");
var app = express();


app.get("/", function(req, res) {
  res.send("Hello World!");
});


const PORT = 5000;
app.listen(PORT, function() {
  console.log("PORT", PORT);
})
