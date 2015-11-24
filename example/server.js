import appSync from "../src/main";

const gateway = appSync({ token: process.env.GITHUB_TOKEN })
gateway
  // .add("ui-harness", "philcockfield/ui-harness-site", "*")
  .add("my-app-2", "philcockfield/app-sync/example/app-2", "*", { branch: "devel" })
  .add("my-app-1", "philcockfield/app-sync/example/app-1", "*/1", { branch: "devel" });



gateway.start()
  .catch(err => console.error("Error:", err));
