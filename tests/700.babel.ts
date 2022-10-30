#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {transformSync} from "@babel/core";
import {demoData} from "../benchmark/demo-data";
import {$$, $$$} from "../";

const TITLE = __filename.split("/").pop()!;

const removeSpaces = (s: string) => s.replace(/(>)\s+|\s+(<)/g, "$1$2");

interface Render {
    render: (ctx: any) => string;
}

const compile = (source: string): Render => {
    const exports = {} as Render;
    const fn = Function("exports", "$$", "$$$", source);
    fn(exports, $$, $$$);
    return exports;
};

/**
 * @see https://babeljs.io/docs/en/babel-plugin-transform-template-literals
 */

const transpile = (source: string): string => {
    const result = transformSync(source, {
        "plugins": [
            ["@babel/plugin-transform-template-literals", {"loose": true}]
        ]
    });
    return result?.code!;
};

describe(TITLE, () => {
    const es6source = 'exports.render = ctx => $$`' +
        '    <table>' +
        '        ${ctx.rows.map(row => $$$`' +
        '            <tr class="${row.className}">' +
        '                ${row.cols.map(col => $$$`' +
        '                    <td class="${col.className}">${col.v}</td>' +
        '                `)}' +
        '            </tr>' +
        '        `)}' +
        '    </table>' +
        '`;'

    const data = demoData(1);

    const expected = `<table><tr class="row"><td class="col">0</td></tr></table>`;

    it("ES6", () => {
        assert.match(es6source, /\$\$`/);
        assert.match(es6source, /\${/);

        const es6 = compile(es6source);
        assert.equal(removeSpaces(es6.render(data)), expected);
    });

    it("ES5", () => {
        const es5source = transpile(es6source);
        assert.doesNotMatch(es5source, /\$\$`/);
        assert.doesNotMatch(es5source, /\${/);

        const es5 = compile(es5source);
        assert.equal(removeSpaces(es5.render(data)), expected);
    });
});
