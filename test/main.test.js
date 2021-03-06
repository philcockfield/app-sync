"use strict";
import Promise from "bluebird";
import { expect } from "chai";
import fsPath from "path";
import appSync from "../src/main";




describe("Main API (module)", () => {
  let api;
  beforeEach(() => {
    Promise.coroutine(function*() {
      api = yield appSync();
    }).call(this);
  });

  describe("init", function() {
    it("initializes with default values", () => {
      expect(api.userAgent).to.equal("app-syncer");
    });

    it("has default values", () => {
      expect(api.apps).to.eql([]);
      expect(api.targetFolder).to.equal("./.build");
    });
  });


  describe("add", function() {
    it("has no apps", () => {
      expect(api.apps).to.eql([]);
    });

    it("adds an app (root of repo)", () => {
      api.add("my-app", "philcockfield/app-sync", "*/foo");
      const app = api.apps[0];
      expect(app.id).to.equal("my-app");
      expect(app.repo.name).to.equal("philcockfield/app-sync");
      expect(app.localFolder).to.equal(fsPath.resolve("./.build/my-app"));
      expect(app.routes.length).to.equal(1);
      expect(app.routes[0].domain).to.equal("*");
      expect(app.routes[0].path).to.equal("foo/");
    });

    it("adds an app with several incoming routes", () => {
      api.add("my-app", "philcockfield/app-sync", ["*/foo", "domain.com"]);
      const app = api.apps[0];
      expect(app.routes.length).to.equal(2);
      expect(app.routes[0].domain).to.equal("*");
      expect(app.routes[0].path).to.equal("foo/");
      expect(app.routes[1].domain).to.equal("domain.com");
      expect(app.routes[1].path).to.equal("*");
    });

    it("adds an app with a path to a sub-folder within the repo", () => {
      api.add("my-app", "philcockfield/app-sync/example/app-1", "*/foo");
      const app = api.apps[0];
      expect(app.id).to.equal("my-app");
      expect(app.repo.name).to.equal("philcockfield/app-sync");
      expect(app.localFolder).to.equal(fsPath.resolve("./.build/my-app"));
    });

    it("adds an app with default values", () => {
      api.add("my-app", "philcockfield/app-sync/example/app-1", "*/foo");
      const app = api.apps[0];
      expect(app.branch).to.equal("master");
    });

    it("throws if the 'id' 'repo' or 'route' are not specified", () => {
      expect(() => api.add(undefined, "user/my-repo", "*/foo")).to.throw();
      expect(() => api.add("name", null, "*/foo")).to.throw();
      expect(() => api.add("name", "user/repo")).to.throw();
    });

    it("throws if the repo is not two parts (username/repo-name)", () => {
      expect(() => api.add("my-app", "fail", "*/foo")).to.throw();
    });

    it("throws if a 'id' is repeated", () => {
      api.add("my-app", "user/my-repo-1", "*/foo-1");
      let fn = () => {
        api.add("my-app", "user/my-repo-2", "*/foo-2");
      };
      expect(fn).to.throw();
    });


    it("throws if a route is repeated", () => {
      api.add("my-app-1", "user/my-repo-1", "*/foo");
      let fn = () => api.add("my-app-2", "user/my-repo-2", ["domain.com", "*/foo"]);
      expect(fn).to.throw();
    });

    it("throws if a route is repeated (within an array)", () => {
      api.add("my-app-1", "user/my-repo-1", ["domain.com", "*/foo"]);
      let fn = () => api.add("my-app-2", "user/my-repo-2", ["google.com", "*/foo"]);
      expect(fn).to.throw();
    });

    it("auto-assigns port numbers", () => {
      api.add("my-app-1", "user/my-repo", "*/foo-1");
      api.add("my-app-2", "user/my-repo", "*/foo-2");
      expect(api.apps[1].port).to.equal(5000);
      expect(api.apps[0].port).to.equal(5001);
    });
  });

  describe("remove", function() {
    it("removes the specified app", () => {
      api.add("my-app-1", "user/my-repo", "*/foo-1");
      return api.remove("my-app-1")
      .then(result => {
          expect(api.apps.length).to.equal(0);
      });
    });
  });


  describe("findAppFromRoute", function() {
    it("does not match the route value", () => {
      api.add("my-app-1", "user/my-repo", "*/foo-1");
      api.add("my-app-2", "user/my-repo", ["*/foo-2", "*/foo-3"]);
      expect(api.findAppFromRoute("*", "bar")).to.equal(undefined);
      expect(api.findAppFromRoute("*")).to.equal(undefined);
    });

    it("matches with a single route per app.", () => {
      api.add("my-app-0", "user/my-repo", "*");
      api.add("my-app-1", "user/my-repo", "*/foo-1");
      api.add("my-app-2", "user/my-repo", "*/foo-2");
      expect(api.findAppFromRoute("*").id).to.equal("my-app-0");
      expect(api.findAppFromRoute("*", "foo-1").id).to.equal("my-app-1");
      expect(api.findAppFromRoute("*", "foo-2").id).to.equal("my-app-2");
    });

    it("matches from multiple routes per app.", () => {
      api.add("my-app-1", "user/my-repo", "*/foo-1");
      api.add("my-app-2", "user/my-repo", ["*/foo-2", "*/bar"]);
      expect(api.findAppFromRoute("*", "bar").id).to.equal("my-app-2");
    });
  });
});
