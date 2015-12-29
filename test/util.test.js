"use strict";
import R from "ramda";
import { expect } from "chai";
import * as util from "../src/util";
import Route from "../src/route";


describe("util", function() {
  describe("sortAppsByRoute", function() {
    it("sorts with wildcards and no wildcards", () => {
      let apps = [
        { id: 0, routes: Route.parseAll("*/z") },
        { id: 1, routes: Route.parseAll("*") },
        { id: 2, routes: Route.parseAll("z.domain.com") },
        { id: 3, routes: Route.parseAll(["*/b", "*/c"]) },
        { id: 4, routes: Route.parseAll("apple.domain.com") },
        { id: 5, routes: Route.parseAll("*/a") },
      ];
      apps = util.sortAppsByRoute(apps);
      apps = util.sortAppsByRoute(apps); // Ensure idempotent.
      expect(apps.map(item => item.id)).to.eql([4, 2, 5, 3, 0, 1]);
    });

    it("sorts with no wildcards", () => {
      let apps = [
        { id: 2, routes: Route.parseAll("z.domain.com") },
        { id: 4, routes: Route.parseAll("apple.domain.com") }
      ];
      apps = util.sortAppsByRoute(apps);
      apps = util.sortAppsByRoute(apps); // Ensure idempotent.
      expect(apps.map(item => item.id)).to.eql([4, 2]);
    });

    it("sorts with only wildcards", () => {
      let apps = [
        { id: 0, routes: Route.parseAll("*/z") },
        { id: 1, routes: Route.parseAll("*") },
        { id: 3, routes: Route.parseAll("*/b") },
        { id: 5, routes: Route.parseAll("*/a") },
      ];
      apps = util.sortAppsByRoute(apps);
      apps = util.sortAppsByRoute(apps); // Ensure idempotent.
      expect(apps.map(item => item.id)).to.eql([5, 3, 0, 1]);
    });
  });
});
