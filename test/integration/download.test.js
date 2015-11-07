"use strict";
import { expect } from "chai";
import fsPath from "path";
import fs from "fs-extra";
import appSync from "../../src";


// NOTE: Tests will work if the GITHUB_TOKEN is not present.
//       The rate-limit will be lower though, so when testing locally
//       if you run into a rate-limit problem add a token to your bash script.
//
//          https://github.com/settings/tokens
//
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const BUILD_PATH = "./.build-test";


describe.only("download (integration)", function() {
  let syncer;
  beforeEach(() => {
    syncer = appSync({ targetFolder: BUILD_PATH, token: process.env.GITHUB_TOKEN })
  });
  // afterEach(() => fs.removeSync(BUILD_PATH));

  it("downloads each registered app", (done) => {
    syncer
      .add("my-app-1", "philcockfield/app-sync/example/app-1")
      .add("my-app-2", "philcockfield/app-sync/example/app-2");


    syncer.download()
    .then(result => {
      console.log("result", result);
      done();
    })
    .catch(err => console.error("ERROR", err))
  });
});
