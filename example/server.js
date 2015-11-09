import syncer from "../src/";


const gateway = syncer({ targetFolder: "./example/.build", token: process.env.GITHUB_TOKEN })
gateway
  .add("my-app-1", "philcockfield/app-sync/example/app-1", "dev", { branch: "devel" })
  .add("my-app-2", "philcockfield/app-sync/example/app-2", "*/bar", { branch: "devel" });



gateway.start()
  // .then(result => {
  // })
  .catch(err => console.error("Error:", err));
