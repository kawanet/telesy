#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {$$, $$$} from "../";
import {mustache2telesy} from "../mustache/parser";

const TITLE = __filename.split("/").pop()!;
const VERBOSE = false;

/**
 * Mustache compatibility test borrowed from Mustatte
 * Note that mustache2telesy is NOT 100% compatible with Mustatte
 * @see https://github.com/kawanet/mustatte/blob/master/test/40.dot.ts
 */

const compile = (source: string) => Function("$$", "$$$", "return " + source)($$, $$$);

describe(TITLE, () => {
    const context = {
        foo: {foo: "FOO", bar: ["B", "A", "R"], buz: "BUZ"},
        qux: "QUX",
        "": {bar: "bar"}
    };

    const alt = {
        foo: {foo: "111", bar: "222", buz: "333", qux: "444"},
        buz: "666",
        qux: "777",
    };

    test("{{#foo}}[{{buz}}]{{/foo}}", "[BUZ]");
    test("{{#foo}}[{{.buz}}]{{/foo}}", "[BUZ]");
    test("{{#foo}}[{{>buz}}]{{/foo}}", "[666]");

    test("{{#foo}}[{{>foo.buz}}]{{/foo}}", "[333]");

    test("{{#foo}}[{{qux}}]{{/foo}}", "[]");
    test("{{#foo}}[{{.qux}}]{{/foo}}", "[]");
    test("{{#foo}}[{{>qux}}]{{/foo}}", "[777]");

    test("{{#foo}}[{{foo}}]{{/foo}}", "[FOO]");
    test("{{#foo}}[{{.foo}}]{{/foo}}", "[FOO]");
    test("{{#foo}}[{{>foo.foo}}]{{/foo}}", "[111]");

    test("{{#foo}}[{{#.}}[{{buz}}]{{/.}}]{{/foo}}", "[[BUZ]]");
    test("{{#foo}}[{{#.}}[{{.buz}}]{{/.}}]{{/foo}}", "[[BUZ]]");
    test("{{#foo}}[{{#.}}[{{>qux}}]{{/.}}]{{/foo}}", "[[777]]");

    test("{{#foo.bar}}[{{.}}]{{/foo.bar}}", "[B][A][R]");
    test("{{#foo}}[{{#bar}}[{{.}}]{{/bar}}]{{/foo}}", "[[B][A][R]]");
    test("{{#foo}}[{{#buz}}[{{foo}}]{{/buz}}]{{/foo}}", "[[FOO]]");

    function test(template: string, expected: string) {
        it(template, () => {
            if (VERBOSE) console.warn(template);
            {
                const render = compile(mustache2telesy(template));
                if (VERBOSE) console.warn(String(render));
                const result = render(context, alt);
                assert.equal(result, expected);
            }

            {
                const render = compile(mustache2telesy(template, {array: "bar", object: "foo", boolean: "buz"}));
                if (VERBOSE) console.warn(String(render));
                const result = render(context, alt);
                assert.equal(result, expected);
            }
        });
    }
});

