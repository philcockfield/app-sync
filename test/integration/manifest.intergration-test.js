"use strict";
import R from "ramda";
import { expect } from "chai";
import fsPath from "path";
import fs from "fs-extra";
import github from "file-system-github";
import { getManifest } from "../../src/manifest";

// NOTE: Tests will work if the GITHUB_TOKEN is not present.
//       The rate-limit will be lower though, so when testing locally
//       if you run into a rate-limit problem add a token to your bash script.
//
//          https://github.com/settings/tokens
//
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const BRANCH = "devel";



describe("manifest (integration)", function() {
  this.timeout(30 * 1000);
  const repo = github.repo("test", "philcockfield/app-sync", { token: GITHUB_TOKEN });

  describe("getManifest", function() {
    it("retrieves a `manifest.yml`", () => {
      return getManifest(repo, `/example/manifest.yml`, BRANCH)
        .then(result => {
            expect(result.apps).to.be.an.instanceof(Object);
            expect(result.apps.foo).to.be.an.instanceof(Object);
            expect(result.apps.bar).to.be.an.instanceof(Object);
            expect(result.apps.foo.route).to.be.a('string');
            expect(result.apps.bar.route).to.be.an.instanceof(Array);
        });
    });

    it("fails if a YAML file was not specified", (done) => {
      getManifest(repo, "/example")
        .catch(err => {
            expect(err.message).to.equal("A path to a YAML file must be specified (.yml)");
            done();
        });
    });

    it("fails to retrieve a manifest (404)", (done) => {
      getManifest(repo, "/does/not/exist.yml")
        .catch(err => {
            expect(err.status).to.equal(404);
            done();
        });
    });

    it("fails to parse YAML", (done) => {
      getManifest(repo, `/example/manifest-corrupt.yml`, BRANCH)
        .then(result => {
            console.log("result", result);
        })
        .catch(err => {
            expect(err.message.startsWith("Failed while parsing YAML")).to.equal(true);
            done();
        });
    });

  });
});
