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

const APP_ID = "app-test";
const APP_SETTINGS = {
  id: APP_ID,
  repo: "philcockfield/app-sync/example/app-1",
  userAgent: "integration-test",
  route: "*/foo",
  targetFolder: BUILD_PATH,
  token: GITHUB_TOKEN,
  branch: "devel"
};




describe("app (integration)", function() {
  this.timeout(15 * 1000);
  let app;

  before(() => {
      app = App(APP_SETTINGS);
      return app.download({ force: false });
  });
  // after(() => { fs.removeSync(BUILD_PATH); });


  describe("version", function() {
    it("gets the local and remote version", () => {
      return app.version()
        .then(version => {
            expect(version.local).not.to.equal(null);
            expect(version.local).to.equal(version.remote);
        });
    });
  });

  describe.only("status cache", function() {
    it("is not downloading", () => {
      return app.statusCache.get(APP_ID)
        .then(result => {
          expect(result.isDownloading).to.equal(false);
        });
    });

    it("is downloading", (done) => {
      app.download({ force: true });
      const fn = () => {
          app.statusCache.get(APP_ID)
            .then(result => {
              expect(result.isDownloading).to.equal(true);
              done();
            })
            .catch(err => console.error(err));

      };
      setTimeout(fn, 10);
    });

    it("resets downloading flag when download is complete", (done) => {
      return app.download({ force: true })
        .then(result => {
            app.statusCache.get(APP_ID)
              .then(result => {
                expect(result.isDownloading).to.equal(false);
                done();
              })
              .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    });
  });
});
