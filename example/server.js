import syncer from "../src/";


const node = syncer({ targetFolder: "./example/.build", token: process.env.GITHUB_TOKEN })

node
  .add("my-app-1", "philcockfield/app-sync/example/app-1")
  .add("my-app-2", "philcockfield/app-sync/example/app-2");

// console.log("app", app);

console.log("node", node);
console.log("-------------------------------------------");

node.apps[0].download()
.then(result => {
  console.log("result", result);
  console.log("");
  // node.apps[0].start();

})
.catch(err => {
  console.log("err", err);
})


// node.apps[0].start();
// node.apps[0].stop();
