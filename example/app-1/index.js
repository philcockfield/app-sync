// Sample app.
console.log("Sample App");
console.log("process.argv", process.argv);
console.log("");

var express = require("express");
var app = express();


let count = 0;
app.get("/", function(req, res) {
  count += 1;
  res.send("Hello World! - " + count);
});


const PORT = 5000;
app.listen(PORT, function() {
    console.log("Listning on port:", PORT);
    console.log("");
});
