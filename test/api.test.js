"use strict";
import { expect } from "chai";
import syncer from "../src";
import fsPath from "path";



describe("Main API", () => {
  describe("targetFolder", function() {
    it("returns the default 'targetFolder' path", () => {
      expect(syncer.targetFolder()).to.equal(fsPath.resolve("./sync"));
    });

    it("changes the 'targetFolder' path", () => {
      syncer
        .targetFolder("./foo")
        .targetFolder("./bar")
      expect(syncer.targetFolder()).to.equal(fsPath.resolve("./bar"));
    });
  });

  describe("add", function() {

    beforeEach(() => {
      syncer.reset();
    });

    it("has no apps", () => {
      expect(syncer.apps).to.eql([]);
    });

    it("adds an app", () => {
      syncer.add("my-app", "philcockfield/node-syncer", { path: "/example/app" });
      expect(syncer.apps[0].name).to.equal("my-app");
      expect(syncer.apps[0].repo).to.equal("philcockfield/node-syncer");
      expect(syncer.apps[0].path).to.equal("/example/app");
    });

    it("throws if the 'name' or 'repo' are not specified", () => {
      expect(() => syncer.add(undefined, "my-repo")).to.throw();
      expect(() => syncer.add("name")).to.throw();
    });

    it("throws if a 'name' is repeated", () => {
      syncer.add("my-app", "my-repo-1");
      let fn = () => {
        syncer.add("my-app", "my-repo-2");
      };
      expect(fn).to.throw();
    });

    it("auto-assigns port numbers", () => {
      syncer.add("my-app-1", "my-repo");
      syncer.add("my-app-2", "my-repo");
      expect(syncer.apps[0].port).to.equal(5000);
      expect(syncer.apps[1].port).to.equal(5001);
    });
  });
});
