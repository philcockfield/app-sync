"use strict";
import R from "ramda";
import { expect } from "chai";
import * as util from "../src/util";



describe("util", function() {
  describe("sortRoutes", function() {
    it("sorts with wildcards and no wildcards", () => {
      let apps = [
        { id: 0, route: "*/z" },
        { id: 1, route: "*" },
        { id: 2, route: "z.domain.com" },
        { id: 3, route: "*/b" },
        { id: 4, route: "apple.domain.com" },
        { id: 5, route: "*/a" },
      ];
      apps = util.sortAppsByRoute(apps);
      apps = util.sortAppsByRoute(apps);
      expect(apps).to.eql([
        { id: 4, route: "apple.domain.com" },
        { id: 2, route: "z.domain.com" },
        { id: 5, route: "*/a" },
        { id: 3, route: "*/b" },
        { id: 0, route: "*/z" },
        { id: 1, route: "*" }
      ]);
    });

    it("sorts with no wildcards", () => {
      let apps = [
        { id: 2, route: "z.domain.com" },
        { id: 4, route: "apple.domain.com" }
      ];
      apps = util.sortAppsByRoute(apps);
      apps = util.sortAppsByRoute(apps);
      expect(apps).to.eql([
        { id: 4, route: "apple.domain.com" },
        { id: 2, route: "z.domain.com" }
      ]);
    });

    it("sorts with only wildcards", () => {
      let apps = [
        { id: 0, route: "*/z" },
        { id: 1, route: "*" },
        { id: 3, route: "*/b" },
        { id: 5, route: "*/a" },
      ];
      apps = util.sortAppsByRoute(apps);
      apps = util.sortAppsByRoute(apps);
      expect(apps).to.eql([
        { id: 5, route: "*/a" },
        { id: 3, route: "*/b" },
        { id: 0, route: "*/z" },
        { id: 1, route: "*" }
      ]);
    });
  });
});
