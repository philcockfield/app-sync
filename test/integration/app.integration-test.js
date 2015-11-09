"use strict";
import { expect } from "chai";
// import fsPath from "path";
import fs from "fs-extra";
import App from "../../src/app";


// NOTE: Tests will work if the GITHUB_TOKEN is not present.
//       The rate-limit will be lower though, so when testing locally
//       if you run into a rate-limit problem add a token to your bash script.
//
//          https://github.com/settings/tokens
//
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const BUILD_PATH = "./.build-test";
const ROUTE = "*/foo";


const APP_SETTINGS = {
  id: "app-test",
  repo: "philcockfield/app-sync/example/app-1",
  userAgent: "integration-test",
  route: "*/foo",
  targetFolder: BUILD_PATH,
  token: GITHUB_TOKEN,
  branch: "gateway" // TEMP
};




describe("app (integration)", function() {
  this.timeout(15 * 1000);
  let app;


  describe("version", function() {
    before((done) => {
        app = App(APP_SETTINGS);
        app.download({ force: false })
          .then(result => done())
          .catch(err => console.error("ERROR", err));
    });
    after(() => { fs.removeSync(BUILD_PATH); });


    it("gets the local and remote version", (done) => {
      app.version()
      .then(version => {
          expect(version.local).not.to.equal(null);
          expect(version.local).to.equal(version.remote);
          done()
      })
      .catch(err => console.error("ERROR", err));
    });

  });
});
