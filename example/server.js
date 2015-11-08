import syncer from "../src/";


const node = syncer({ targetFolder: "./example/.build", token: process.env.GITHUB_TOKEN })
node
  .add("my-app-1", "philcockfield/app-sync/example/app-1")
  .add("my-app-2", "philcockfield/app-sync/example/app-2");

// console.log("app", app);

// console.log("node", node);
// console.log("-------------------------------------------");

// node.download()
// .then(result => {
//   console.log("result", result);
//   console.log("");
// })
// .catch(err => {
//   console.log("err", err);
// })


node.start()
.then(result => {
  // console.log("result", result.server);
  // console.log("result >> ", result);
  // console.log("result.gateway.server", result.gateway.server);
})
.catch(err => console.error("Error:", err));


// node.start()
// .catch(err => console.error("Error:", err));


// setTimeout(() => {
//   node.stop();
// }, 1000);
