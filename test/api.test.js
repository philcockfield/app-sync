"use strict";
import { expect } from "chai";
import fsPath from "path";
import fs from "fs-extra";
import appSync from "../src";

// NOTE: Tests will work if the GITHUB_TOKEN is not present.
//       The rate-limit will be lower though, so when testing locally
//       if you run into a rate-limit problem add a token to your bash script.
//
//          https://github.com/settings/tokens
//
const GITHUB_TOKEN = process.env.GITHUB_TOKEN



describe("api (module)", () => {
  describe("init", function() {
    it("initializes with default values", () => {
      const node = appSync();
      expect(node.userAgent).to.equal("app-syncer");
    });

    it("has default values", () => {
      const node = appSync();
      expect(node.apps).to.eql([]);
      expect(node.targetFolder).to.equal("./.build");
    });
  });


  describe("add", function() {
    let node;
    beforeEach(() => {
      node = appSync({ token: GITHUB_TOKEN });
    });

    it("has no apps", () => {
      expect(node.apps).to.eql([]);
    });

    it("adds an app (root of repo)", () => {
      node.add("my-app", "philcockfield/app-sync");
      const app = node.apps[0];
      expect(app.id).to.equal("my-app");
      expect(app.repo.name).to.equal("philcockfield/app-sync");
      expect(app.localFolder).to.equal(fsPath.resolve("./.build/my-app"));
    });

    it("adds an app with a path to a sub-folder within the repo", () => {
      node.add("my-app", "philcockfield/app-sync/example/app-1");
      const app = node.apps[0];
      expect(app.id).to.equal("my-app");
      expect(app.repo.name).to.equal("philcockfield/app-sync");
      expect(app.localFolder).to.equal(fsPath.resolve("./.build/my-app"));
    });

    it("adds an app with default values", () => {
      node.add("my-app", "philcockfield/app-sync/example/app-1");
      const app = node.apps[0];
      expect(app.branch).to.equal("master");
    });

    it("throws if the 'name' or 'repo' are not specified", () => {
      expect(() => node.add(undefined, "user/my-repo")).to.throw();
      expect(() => node.add("name")).to.throw();
    });

    it("throws if the repo is not two parts (username/repo-name)", () => {
      expect(() => node.add("my-app", "fail")).to.throw();
    });

    it("throws if a 'name' is repeated", () => {
      node.add("my-app", "user/my-repo-1");
      let fn = () => {
        node.add("my-app", "user/my-repo-2");
      };
      expect(fn).to.throw();
    });

    it("auto-assigns port numbers", () => {
      node.add("my-app-1", "user/my-repo");
      node.add("my-app-2", "user/my-repo");
      expect(node.apps[0].port).to.equal(5000);
      expect(node.apps[1].port).to.equal(5001);
    });
  });
});
