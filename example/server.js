import syncer from "../";


const node = syncer({ targetFolder: "./example/.synced-apps" });

node
  .add("my-app", "philcockfield/node-syncer/example/app-1")

// console.log("app", app);

console.log("node", node);

node.apps[0].download()
.then(result => {
  console.log("result", result);
})
.catch(err => {
  console.log("err", err);
})
