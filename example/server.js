import appSync from "../src/main";

const gateway = appSync({
  token: process.env.GITHUB_TOKEN,
  apiRoute: "*/api",
  manifest: "philcockfield/app-sync/example/manifest.yml:devel"
});

// gateway
//   // .add("ui-harness", "philcockfield/ui-harness-site", "*")
//   .add("two", "philcockfield/app-sync/example/app-2", "*", { branch: "devel" })
//   .add("one", "philcockfield/app-sync/example/app-1", "*/1", { branch: "devel" });



gateway.start()
  .catch(err => console.error("Error:", err));
