"use strict";
import R from "ramda";
import { expect } from "chai";
import fsPath from "path";
import app from "../src/app";


const DEFAULT_PARAMS = {
  id: "my-app",
  repo: "user/repo",
  userAgent: "ua",
  route: "*/foo"
};



describe("app", function() {
  it("has a default branch ('master')", () => {
    expect(app(DEFAULT_PARAMS).branch).to.equal("master");
  });

  it("has a default port", () => {
    expect(app(DEFAULT_PARAMS).port).to.equal(5000);
  });

  it("has a default target folder", () => {
    expect(app(DEFAULT_PARAMS).localFolder).to.equal(fsPath.resolve("./.build/my-app"));
  });
});
