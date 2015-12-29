"use strict";
import R from "ramda";
import Promise from "bluebird";
import { expect } from "chai";
import fs from "fs-extra";
import fsPath from "path";
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
  this.timeout(30 * 1000);

  before(() => {
      const app = App(APP_SETTINGS);
      return app.update();
  });
  beforeEach(() => {
    fs.removeSync(fsPath.join(BUILD_PATH, ".status"));
  });
  after(() => { fs.removeSync(BUILD_PATH); });


  describe("version", function() {
    it("gets the local and remote version", () => {
      const app = new App(APP_SETTINGS);
      return app.version()
        .then(version => {
            expect(version.local).not.to.equal(null);
            expect(version.local).to.equal(version.remote);
        });
    });

    it("does not have a remote version (repo does not exist)", () => {
      const settings = R.clone(APP_SETTINGS);
      settings.repo = "username/does-not-exist";
      settings.branch = "master";
      // settings.branch = "does-not-exist";
      const app = new App(settings);
      return app.version()
        .then(version => {
            expect(version.remote).to.equal(null);
            expect(version.isUpdateRequired).to.equal(undefined);
            expect(version.isDependenciesChanged).to.equal(undefined);
        });
    });

    it("does not have a remote version (branch does not exist)", () => {
      const settings = R.clone(APP_SETTINGS);
      settings.branch = "does-not-exist";
      const app = new App(settings);
      return app.version()
        .then(version => {
            expect(version.remote).to.equal(null);
            expect(version.isUpdateRequired).to.equal(undefined);
            expect(version.isDependenciesChanged).to.equal(undefined);
        });
    });
  });


  describe("download", function() {
    it("does not force the download (already exists)", () => {
      const app = new App(APP_SETTINGS);
      return app.download({ force: false })
        .then(result => {
          expect(result.alreadyExists).to.equal(true);
        });
    });
  });



  describe("update", function() {
    let app;
    const MODULE_PATH = fsPath.join(BUILD_PATH, "update-test");
    const PACKAGE_PATH = fsPath.join(BUILD_PATH, "update-test/package.json");

    beforeEach(() => {
      // Make a copy of the sample app to manipulate.
      fs.removeSync(MODULE_PATH);
      fs.copySync(fsPath.join(BUILD_PATH, "app-test"), MODULE_PATH);
      app = App(R.merge(APP_SETTINGS, { id: "update-test" }));
    });

    const changePackage = (fn) => {
          const json = fs.readJsonSync(PACKAGE_PATH);
          fn(json);
          fs.writeJsonSync(PACKAGE_PATH, json);
        };

    it("does not update the app", () => {
      return app.update()
        .then(result => expect(result.updated).to.equal(false));
    });

    it("updates to new version (without running NPM install)", () => {
      changePackage(json => json.version = "0.0.1");
      return app.update()
        .then(result => {
          expect(result.updated).to.equal(true);
          expect(result.installed).to.equal(false);
        });
    });

    describe("installs NPM modules", function() {
      it("installs when `node_modules` folder does not exist", () => {
        changePackage(json => json.version = "0.0.1");
        const NODE_MODULES_PATH = fsPath.join(MODULE_PATH, "node_modules");
        fs.removeSync(NODE_MODULES_PATH);
        expect(fs.existsSync(NODE_MODULES_PATH)).to.equal(false);
        return app.update()
          .then(result => {
            expect(result.updated).to.equal(true);
            expect(result.installed).to.equal(true);
            expect(fs.existsSync(NODE_MODULES_PATH)).to.equal(true);
          });
      });

      it("installs when dependencies have changed", () => {
        changePackage(json => {
          json.version = "0.0.1";
          json.dependencies.express = "0.0.2";
        });
        return app.update()
          .then(result => {
            expect(result.updated).to.equal(true);
            expect(result.installed).to.equal(true);
          });
      });
    });
  });
});
