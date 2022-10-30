#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {$$$} from "../";

const TITLE = __filename.split("/").pop()!;

describe(TITLE, () => {
    const equal = (actual: ReturnType<typeof $$$>, expected: string) => {
        assert.equal(typeof actual, "object", expected);
        assert.equal(typeof (actual && actual.outerHTML), "string", expected);
        assert.equal(actual.outerHTML, expected);
        assert.equal(String(actual), expected);
    };

    it("no variable", () => {
        equal($$$``, "");
        equal($$$`foo`, "foo");
    });

    it("strings", () => {
        equal($$$`foo-${"bar"}-buz`, "foo-bar-buz");
        equal($$$`foo-${"bar"}-${"buz"}-qux`, "foo-bar-buz-qux");
        equal($$$`foo-${"bar"}-${"buz"}-${"qux"}-quux`, "foo-bar-buz-qux-quux");
        equal($$$`foo-${"bar"}${"buz"}${"qux"}-quux`, "foo-barbuzqux-quux");
    });

    it("numbers", () => {
        equal($$$`[${0}]`, "[0]");
        equal($$$`[${0}${0.1}]`, "[00.1]");
        equal($$$`[${0}${0.1}${-2}]`, "[00.1-2]");
    });

    it("empty values", () => {
        equal($$$`[${""}-${null}-${undefined}-${false}]`, "[---]");
    });

    it("escapes", () => {
        equal($$$`<input name="&" value="'">`, `<input name="&" value="'">`);
        equal($$$`[${`<input name="&" value="'">`}]`, `[&lt;input name=&quot;&amp;&quot; value=&quot;&apos;&quot;&gt;]`);
    });

    it("outerHTML", () => {
        equal($$$`[${({outerHTML: "<foo>"})}]`, "[<foo>]");
        equal($$$`[${[{outerHTML: "<bar>"}]}]`, "[<bar>]");
        equal($$$`[${[{outerHTML: "<buz>"}, {outerHTML: "<qux>"}]}]`, "[<buz><qux>]");
    });

    it("function call", () => {
        equal($$$({outerHTML: "<foo>"}), "<foo>");
        equal($$$("<bar>"), "<bar>");
        equal($$$(0), "0");
        equal($$$(1), "1");
        equal($$$(null), "");
        equal($$$(undefined), "");
        equal($$$(false), "");
        equal($$$($$$("<foo>")), "<foo>");
        equal($$$($$$($$$("<bar>"))), "<bar>");
        equal($$$([$$$("<buz>")]), "<buz>");
        equal($$$([$$$([$$$("<qux>")])]), "<qux>");
    });

    it("stringify", () => {
        assert.equal(String($$$("<bar>")), "<bar>");
        assert.equal("" + ($$$("<buz>")), "<buz>");
        assert.equal("".concat($$$("<qux>") as any), "<qux>");
        assert.equal([$$$("<quux>")].join(""), "<quux>");
    });

    it("irregular usage", () => {
        // @ts-ignore
        equal($$$(true), "true");
        // @ts-ignore
        equal($$$(["<quux>"]), "<quux>");
    });

    it('$$$("<foo>") === $$$`<foo>`', () => {
        assert.equal($$$("<foo>").outerHTML, $$$`<foo>`.outerHTML);
    });
});