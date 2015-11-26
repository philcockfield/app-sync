"use strict";
import { expect } from "chai";
import fs from "fs-extra";
import App from "../../src/app";

const delay = (msecs, fn) => setTimeout(fn, msecs);


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
      return app.download({ force: false, install: false });
  });
  after(() => { fs.removeSync(BUILD_PATH); });


  describe("version", function() {
    it("gets the local and remote version", () => {
      return app.version()
        .then(version => {
            expect(version.local).not.to.equal(null);
            expect(version.local).to.equal(version.remote);
        });
    });
  });


  describe("download", function() {
    it("does not force the download (already exists)", () => {
      return app.download({ force: false })
        .then(result => {
          expect(result.alreadyExists).to.equal(true);
        });
    });

    it("does not download when another instance of the app is downloading", (done) => {
      const app1 = App(APP_SETTINGS);
      const app2 = App(APP_SETTINGS);
      app1.download({ force: true, install: false });
      delay(10, () => {
        app2.download({ force: true, install: false })
          .then(result => {
            expect(result.downloadedByAnotherProcess).to.equal(true);
            done();
          });
      });
    });
  });


  describe("status cache", function() {
    it("is not downloading", () => {
      return app.statusCache.get(APP_ID)
        .then(result => {
          expect(result.isDownloading).to.equal(false);
        });
    });

    it("is downloading", (done) => {
      app.download({ force: true });
      delay(10, () => {
          app.statusCache.get(APP_ID)
            .then(result => {
              expect(result.isDownloading).to.equal(true);
              done();
            })
            .catch(err => console.error(err));
      });
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
