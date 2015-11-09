import syncer from "../src/";


const node = syncer({ targetFolder: "./example/.build", token: process.env.GITHUB_TOKEN })
node
  .add("my-app-1", "philcockfield/app-sync/example/app-1", "dev", { branch: "devel" })
  .add("my-app-2", "philcockfield/app-sync/example/app-2", "*/bar", { branch: "devel" });


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


const start = () => {
    node.start()
    .then(result => {
      // console.log("result", result.server);
      // console.log("result >> ", result);
      // console.log("result.gateway.server", result.gateway.server);
    })
    .catch(err => console.error("Error:", err));


    // node.start()
    // .catch(err => console.error("Error:", err));


    setTimeout(() => {
      // node.stop();
      // console.log("update");
      node.apps[0].update();
      node.apps[1].update();
    }, 3000);
};


// node.apps[0].version()
// .then(version => {
//   console.log("version", version);
// })

start();

// node.download({ force: false })
// .then(result => {
//   start();
// })
