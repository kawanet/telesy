import {strict as assert} from "assert";

import * as telesy from "../";

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

    describe("$$$", () => {
        const {$$$} = telesy;

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