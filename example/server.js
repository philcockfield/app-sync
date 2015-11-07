import syncer from "../src/";


const node = syncer({ targetFolder: "./example/.build" })
  .add("my-app-name", "philcockfield/node-syncer/example/app-1");

// console.log("app", app);

console.log("node", node);
console.log("-------------------------------------------");

node.apps[0].download()
.then(result => {
  console.log("result", result);
  node.apps[0].start();

})
.catch(err => {
  console.log("err", err);
})


// node.apps[0].start();
// node.apps[0].stop();
