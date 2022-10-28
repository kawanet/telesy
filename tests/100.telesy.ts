#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {$$} from "../";

const TITLE = __filename.split("/").pop()!;

describe(TITLE, () => {
    const equal = (actual: string, expected: string) => {
        assert.equal(typeof actual, "string", expected);
        assert.equal(actual, expected);
    };

    it("no variable", () => {
        equal($$``, "");
        equal($$`foo`, "foo");
    });

    it("strings", () => {
        equal($$`foo-${"bar"}-buz`, "foo-bar-buz");
        equal($$`foo-${"bar"}-${"buz"}-qux`, "foo-bar-buz-qux");
        equal($$`foo-${"bar"}-${"buz"}-${"qux"}-quux`, "foo-bar-buz-qux-quux");
        equal($$`foo-${"bar"}${"buz"}${"qux"}-quux`, "foo-barbuzqux-quux");
    });

    it("numbers", () => {
        equal($$`[${0}]`, "[0]");
        equal($$`[${0}${0.1}]`, "[00.1]");
        equal($$`[${0}${0.1}${-2}]`, "[00.1-2]");
    });

    it("empty values", () => {
        equal($$`[${""}-${null}-${undefined}-${false}]`, "[---]");
    });

    it("escapes", () => {
        equal($$`<input name="&" value="'">`, `<input name="&" value="'">`);
        equal($$`[${`<input name="&" value="'">`}]`, `[&lt;input name=&quot;&amp;&quot; value=&quot;&apos;&quot;&gt;]`);
    });

    it("outerHTML", () => {
        equal($$`[${({outerHTML: "<foo>"})}]`, "[<foo>]");
        equal($$`[${[{outerHTML: "<bar>"}]}]`, "[<bar>]");
        equal($$`[${[{outerHTML: "<buz>"}, {outerHTML: "<qux>"}]}]`, "[<buz><qux>]");
    });

    it("function call", () => {
        equal($$({outerHTML: "<foo>"}), "<foo>");
        equal($$("<bar>"), "&lt;bar&gt;");
        equal($$(0), "0");
        equal($$(1), "1");
        equal($$(null), "");
        equal($$(undefined), "");
        equal($$(false), "");
    });

    it("irregular usage", () => {
        // @ts-ignore
        equal($$(true), "true");
        // @ts-ignore
        equal($$(["<quux>"]), "&lt;quux&gt;");
    });
});