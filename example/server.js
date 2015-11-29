import appSync from "../src/main";

const api = appSync({
  token: process.env.GITHUB_TOKEN,
  apiRoute: "*/api",
  manifest: "philcockfield/app-sync/example/manifest.yml:devel"
})
// .then(api => {
  // api
  //   .add("foo", "philcockfield/app-sync/example/app-2", "*", { branch: "devel" })
  //   .add("bar", "philcockfield/app-sync/example/app-1", "*/bar", { branch: "devel" });



api.start()
  .catch(err => console.error("Error:", err));
