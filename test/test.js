"use strict";
import { expect } from "chai";
import fsPath from "path";
import appSync from "../src";




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
      node = appSync();
    });

    it("has no apps", () => {
      expect(node.apps).to.eql([]);
    });

    it("adds an app (root of repo)", () => {
      node.add("my-app", "philcockfield/app-sync", "*/foo");
      const app = node.apps[0];
      expect(app.id).to.equal("my-app");
      expect(app.repo.name).to.equal("philcockfield/app-sync");
      expect(app.localFolder).to.equal(fsPath.resolve("./.build/my-app"));
      expect(app.route.domain).to.equal("*");
      expect(app.route.path).to.equal("foo/");
    });

    it("adds an app with a path to a sub-folder within the repo", () => {
      node.add("my-app", "philcockfield/app-sync/example/app-1", "*/foo");
      const app = node.apps[0];
      expect(app.id).to.equal("my-app");
      expect(app.repo.name).to.equal("philcockfield/app-sync");
      expect(app.localFolder).to.equal(fsPath.resolve("./.build/my-app"));
    });

    it("adds an app with default values", () => {
      node.add("my-app", "philcockfield/app-sync/example/app-1", "*/foo");
      const app = node.apps[0];
      expect(app.branch).to.equal("master");
    });

    it("throws if the 'name' 'repo' or 'route' are not specified", () => {
      expect(() => node.add(undefined, "user/my-repo", "*/foo")).to.throw();
      expect(() => node.add("name", null, "*/foo")).to.throw();
      expect(() => node.add("name", "user/repo")).to.throw();
    });

    it("throws if the repo is not two parts (username/repo-name)", () => {
      expect(() => node.add("my-app", "fail", "*/foo")).to.throw();
    });

    it("throws if a 'name' is repeated", () => {
      node.add("my-app", "user/my-repo-1", "*/foo");
      let fn = () => {
        node.add("my-app", "user/my-repo-2", "*/foo");
      };
      expect(fn).to.throw();
    });

    it("auto-assigns port numbers", () => {
      node.add("my-app-1", "user/my-repo", "*/foo");
      node.add("my-app-2", "user/my-repo", "*/foo");
      expect(node.apps[0].port).to.equal(5000);
      expect(node.apps[1].port).to.equal(5001);
    });
  });
});
