import syncer from "../src/";


const gateway = syncer({ token: process.env.GITHUB_TOKEN })
gateway
  .add("my-app-2", "philcockfield/app-sync/example/app-2", "*", { branch: "devel" })
  .add("my-app-1", "philcockfield/app-sync/example/app-1", "*/foo", { branch: "devel" });



gateway.start()
  .catch(err => console.error("Error:", err));
