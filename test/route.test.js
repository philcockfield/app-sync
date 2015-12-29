"use strict"
import { expect } from "chai";
import route from "../src/route";



describe("route", function() {
  it("throws if route not specified", () => {
    expect(() => route.parse()).to.throw();
    expect(() => route.parse(null)).to.throw();
    expect(() => route.parse("")).to.throw();
  });


  it("has a wildcard domain (*)", () => {
    expect(route.parse("*").domain).to.equal("*");
    expect(route.parse("*/").domain).to.equal("*");
    expect(route.parse(" * ").domain).to.equal("*");
    expect(route.parse(" *  /").domain).to.equal("*");
    expect(route.parse(" *  /path").domain).to.equal("*");
  });


  it("has a wildcard path (*)", () => {
    expect(route.parse("*").path).to.equal("*");
    expect(route.parse("*/").path).to.equal("*");
    expect(route.parse("*/  ").path).to.equal("*");
    expect(route.parse("*/*").path).to.equal("*");
    expect(route.parse("*/*/").path).to.equal("*");
    expect(route.parse("*/  *  ").path).to.equal("*");
    expect(route.parse("domain.com/*").path).to.equal("*");
    expect(route.parse("domain.com").path).to.equal("*");
  });


  describe("match", function() {
    it("matches on specific domain (no path)", () => {
      expect(route.parse("www.foo.com").match("www.foo.com")).to.equal(true);
      expect(route.parse("www.foo.com").match("www.foo.com", "")).to.equal(true);
      expect(route.parse("www.foo.com/*").match("www.foo.com", "bar")).to.equal(true);
      expect(route.parse("www.foo.com/*").match("www.foo.com", "/bar")).to.equal(true);
      expect(route.parse("www.foo.com").match("www.foo.com", "/bar")).to.equal(true);
    });

    it("matches on specific domain (with path)", () => {
      expect(route.parse("www.foo.com/bar").match("www.foo.com", "bar")).to.equal(true);
      expect(route.parse("www.foo.com/bar").match("www.foo.com", "bar")).to.equal(true);
      expect(route.parse("www.foo.com/bar").match("www.foo.com", "/bar")).to.equal(true);
    });

    it("does not match on specific domain (no path)", () => {
      expect(route.parse("www.foo.com").match("www.bar.org")).to.equal(false);
      expect(route.parse("www.foo.com").match("www.bar.org", "foo")).to.equal(false);
    });

    it("does not match on specific domain (with path)", () => {
      expect(route.parse("www.foo.com/bar").match("www.bar.org")).to.equal(false);
      expect(route.parse("www.foo.com/bar").match("www.foo.com")).to.equal(false);
      expect(route.parse("www.foo.com/bar").match("www.foo.com", "")).to.equal(false);
      expect(route.parse("www.foo.com/bar").match("www.foo.com", "zoo")).to.equal(false);
      expect(route.parse("www.foo.com/bar").match("www.foo.com", "barry")).to.equal(false);
    });

    it("matches on wildcard domain (*) with path", () => {
      expect(route.parse("*/foo").match("bar.com", "foo")).to.equal(true);
    });

    it("matches on wildcard domain (*) with no path", () => {
      expect(route.parse("*").match("foo.com")).to.equal(true);
      expect(route.parse("*").match("bar.com")).to.equal(true);
      expect(route.parse("*").match("bar.com", "path")).to.equal(true);
    });

    it("does not match on wildcard domain (*) with path", () => {
      expect(route.parse("*/foo").match("bar.com")).to.equal(false);
      expect(route.parse("*/foo").match("bar.com", "bar")).to.equal(false);
    });
  });
});
