import {strict as assert} from "assert";

import * as telesy from "../src/telesy";

const TITLE = __filename.split("/").pop() as string;

describe(TITLE, () => {
    const {$$} = telesy;

    describe("$$", () => {
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
        });

        it("irregular usage", () => {
            // @ts-ignore
            equal($$(0), "0");
            // @ts-ignore
            equal($$(1), "1");
            // @ts-ignore
            equal($$(null), "");
            // @ts-ignore
            equal($$(undefined), "");
            // @ts-ignore
            equal($$(true), "true");
            // @ts-ignore
            equal($$(false), "");
        });
    });

    describe("$$$", () => {
        const {$$$} = telesy;

        const equal = (actual: Telesy.Fragment, expected: string) => {
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
            equal($$$("<foo>"), "<foo>");
        });

        it("stringify", () => {
            assert.equal(String($$$("<bar>")), "<bar>");
            assert.equal("" + ($$$("<buz>")), "<buz>");
            assert.equal("".concat($$$("<qux>") as any), "<qux>");
            assert.equal([$$$("<quux>")].join(""), "<quux>");
        });

        it("irregular usage", () => {
            // @ts-ignore
            equal($$$(0), "0");
            // @ts-ignore
            equal($$$(1), "1");
            // @ts-ignore
            equal($$$(null), "");
            // @ts-ignore
            equal($$$(undefined), "");
            // @ts-ignore
            equal($$$(true), "true");
            // @ts-ignore
            equal($$$(false), "");
            // @ts-ignore
            equal($$$($$$("<foo>")), "<foo>");
            // @ts-ignore
            equal($$$($$$($$$("<bar>"))), "<bar>");
            // @ts-ignore
            equal($$$([$$$("<buz>")]), "<buz>");
            // @ts-ignore
            equal($$$([$$$([$$$("<qux>")])]), "<qux>");
            // @ts-ignore
            equal($$$(["<quux>"]), "<quux>");
        });
    });

    describe("$$ + $$$", () => {
        const {$$, $$$} = telesy;

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
});