"use strict";
import { expect } from "chai";
import fsPath from "path";
import fs from "fs-extra";
import appSync from "../../src/main";


// NOTE: Tests will work if the GITHUB_TOKEN is not present.
//       The rate-limit will be lower though, so when testing locally
//       if you run into a rate-limit problem add a token to your bash script.
//
//          https://github.com/settings/tokens
//
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const BUILD_PATH = "./.build-test";


describe("download (integration)", function() {
  this.timeout(30 * 1000);
  let node;
  beforeEach(() => {
    node = appSync({ targetFolder: BUILD_PATH, token: process.env.GITHUB_TOKEN })
  });
  afterEach(() => fs.removeSync(BUILD_PATH));



  it("downloads a single app", () => {
    node
      .add("single-app", "philcockfield/app-sync/example/app-1", "*/foo");

    const app = node.apps[0];
    return app.download()
    .then(result => {
        expect(fs.existsSync("./.build-test/single-app/package.json")).to.equal(true);
        expect(fs.existsSync("./.build-test/single-app/node_modules")).to.equal(false);
    });
  });



  it("downloads each registered app", () => {
    node
      .add("my-app-1", "philcockfield/app-sync/example/app-1", "*/foo-1")
      .add("my-app-2", "philcockfield/app-sync/example/app-2", "*/foo-2");

    return node.download({ install: false }) // Default install is 'true'.
      .then(result => {
          expect(fs.existsSync("./.build-test/my-app-1/package.json")).to.equal(true);
          expect(fs.existsSync("./.build-test/my-app-1/node_modules")).to.equal(false);
          expect(fs.existsSync("./.build-test/my-app-2/package.json")).to.equal(true);
          expect(fs.existsSync("./.build-test/my-app-2/node_modules")).to.equal(false);
      });
  });
});
