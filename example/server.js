import appSync from "../src/main";

const gateway = appSync({
  token: process.env.GITHUB_TOKEN,
  apiRoute: "*/api"
});

gateway
  // .add("ui-harness", "philcockfield/ui-harness-site", "*")
  .add("one", "philcockfield/app-sync/example/app-2", "*", { branch: "devel" })
  .add("two", "philcockfield/app-sync/example/app-1", "*/1", { branch: "devel" });



gateway.start()
  .catch(err => console.error("Error:", err));
