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


  describe("routes", function() {
    it("stores a single route as an array", () => {
      expect(app(DEFAULT_PARAMS).routes.length).to.equal(1);
    });

    it("stores several routes", () => {
      const SETTINGS = R.clone(DEFAULT_PARAMS);
      SETTINGS.route = ["*/foo", "www.domain.com"]

      const routes = app(SETTINGS).routes;
      expect(routes.length).to.equal(2);
      expect(routes[0].domain).to.equal("*");
      expect(routes[1].domain).to.equal("www.domain.com");
    });

    it("throws if a route was not specified", () => {
      const createWithRoute = (route) => {
            const SETTINGS = R.clone(DEFAULT_PARAMS);
            SETTINGS.route = route;
            return app(SETTINGS);
          };
      expect(() => createWithRoute("")).to.throw();
      expect(() => createWithRoute()).to.throw();
      expect(() => createWithRoute(null)).to.throw();
      expect(() => createWithRoute([])).to.throw();
      expect(() => createWithRoute([""])).to.throw();
      expect(() => createWithRoute([null, undefined, ""])).to.throw();
    });
  });
});
