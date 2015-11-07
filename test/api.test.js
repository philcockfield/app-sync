"use strict";
import { expect } from "chai";
import syncer from "../src";
import fsPath from "path";

// NOTE: Tests will work if the GITHUB_TOKEN is not present.
//       The rate-limit will be lower though, so when testing locally
//       if you run into a rate-limit problem add a token to your bash script.
//
//          https://github.com/settings/tokens
//
const GITHUB_TOKEN = process.env.GITHUB_TOKEN



describe("Main API", () => {
  describe("init", function() {
    it("initializes with default values", () => {
      const app = syncer();
      expect(app.userAgent).to.equal("app-syncer");
    });

    it("has default values", () => {
      const app = syncer();
      expect(app.apps).to.eql([]);
      expect(app.targetFolder).to.equal("./.build");
    });
  });


  describe("add", function() {
    let app;
    beforeEach(() => {
      app = syncer({ token: GITHUB_TOKEN });
    });

    it("has no apps", () => {
      expect(app.apps).to.eql([]);
    });

    it("adds an app (root of repo)", () => {
      app.add("my-app", "philcockfield/node-syncer");
      expect(app.apps[0].name).to.equal("my-app");
      expect(app.apps[0].repo.name).to.equal("philcockfield/node-syncer");
      expect(app.apps[0].path).to.equal(undefined);
    });

    it("adds an app with a path to a sub-folder within the repo", () => {
      app.add("my-app", "philcockfield/node-syncer/example/app-1");
      expect(app.apps[0].name).to.equal("my-app");
      expect(app.apps[0].repo.name).to.equal("philcockfield/node-syncer");
      expect(app.apps[0].path).to.equal("example/app-1");
    });

    it("throws if the 'name' or 'repo' are not specified", () => {
      expect(() => app.add(undefined, "user/my-repo")).to.throw();
      expect(() => app.add("name")).to.throw();
    });

    it("throws if the repo is not two parts (username/repo-name)", () => {
      expect(() => app.add("my-app", "fail")).to.throw();
    });

    it("throws if a 'name' is repeated", () => {
      app.add("my-app", "user/my-repo-1");
      let fn = () => {
        app.add("my-app", "user/my-repo-2");
      };
      expect(fn).to.throw();
    });

    it("auto-assigns port numbers", () => {
      app.add("my-app-1", "user/my-repo");
      app.add("my-app-2", "user/my-repo");
      expect(app.apps[0].port).to.equal(5000);
      expect(app.apps[1].port).to.equal(5001);
    });
  });
});
