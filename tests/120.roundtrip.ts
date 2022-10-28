import {strict as assert} from "assert";

import {$$, $$$} from "../";

const TITLE = __filename.split("/").pop() as string;

describe(TITLE, () => {
    it("$$`[${...}]`", () => {
        assert.equal($$`[<foo>]`, "[<foo>]");
        assert.equal($$`[${`<bar>`}]`, "[&lt;bar&gt;]");
        assert.equal($$`[${$$`<buz>`}]`, "[&lt;buz&gt;]");
        assert.equal($$`[${$$$`<qux>`}]`, "[<qux>]");
        assert.equal($$`[${[$$$`<quux>`]}]`, "[<quux>]");
    });

    it("$$`[${...}-${...}-${...}]`", () => {
        assert.equal($$`[<foo>-<foo>-<foo>]`, "[<foo>-<foo>-<foo>]");
        assert.equal($$`[${`<bar>`}-${`<bar>`}-${`<bar>`}]`, "[&lt;bar&gt;-&lt;bar&gt;-&lt;bar&gt;]");
        assert.equal($$`[${$$`<buz>`}-${$$`<buz>`}-${$$`<buz>`}]`, "[&lt;buz&gt;-&lt;buz&gt;-&lt;buz&gt;]");
        assert.equal($$`[${$$$`<qux>`}-${$$$`<qux>`}-${$$$`<qux>`}]`, "[<qux>-<qux>-<qux>]");
        assert.equal($$`[${[$$$`<quux>`]}-${[$$$`<quux>`]}-${[$$$`<quux>`]}]`, "[<quux>-<quux>-<quux>]");
    });

    it("$$`[${$$$(...)}]`", () => {
        assert.equal($$`[${$$$("<foo>")}]`, "[<foo>]");
        assert.equal($$`[${$$$("<bar>")}-${$$$("<bar>")}]`, "[<bar>-<bar>]");
        assert.equal($$`[${$$$("<buz>")}-${$$$("<buz>")}-${$$$("<buz>")}]`, "[<buz>-<buz>-<buz>]");
    });

    it("$$`[${[$$$(...)]}]`", () => {
        assert.equal($$`[${[$$$("<foo>")]}]`, "[<foo>]");
        assert.equal($$`[${[$$$("<bar>")]}-${[$$$("<bar>")]}]`, "[<bar>-<bar>]");
        assert.equal($$`[${[$$$("<buz>")]}-${[$$$("<buz>")]}-${[$$$("<buz>")]}]`, "[<buz>-<buz>-<buz>]");
    });

    it(`$$($$$("..."))`, () => {
        assert.equal($$($$$("<foo>")), "<foo>");
    });

    it(`$$$($$({outerHTML: "..."}))`, () => {
        assert.equal($$$($$({outerHTML: "<foo>"})).outerHTML, "<foo>");
    });
});