import syncer from "../";

syncer
  .targetFolder("./example/synced-sites")
  .add("my-app", "philcockfield/node-syncer", { path: "/example/app" })

console.log("syncer", syncer);
