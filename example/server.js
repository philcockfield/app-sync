import syncer from "../";


const node = syncer({ targetFolder: "./example/.build" });

node
  .add("my-app-name", "philcockfield/node-syncer/example/app-1")

// console.log("app", app);

console.log("node", node);
console.log("-------------------------------------------");

node.apps[0].download()
.then(result => {
  console.log("result", result);
})
.catch(err => {
  console.log("err", err);
})
