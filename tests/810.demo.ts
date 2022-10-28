#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import * as fs from "fs";
import {$$, $$$} from "../";
import {mustache2telesy} from "../mustache/parser";
import {telesyRender} from "../benchmark/demo-telesy";
import {demoData} from "../benchmark/demo-data";

const TITLE = __filename.split("/").pop()!;

const compile = (source: string) => Function("$$", "$$$", "return " + mustache2telesy(source))($$, $$$);

const removeSpaces = (s: string) => s.replace(/(>)\s+|\s+(<)/g, "$1$2");

const expected = `<table><tr class="row"><td class="col">0</td></tr></table>`;

describe(TITLE, () => {
    const data = demoData(1);

    it("demo-telesy.ts", () => {
        assert.equal(removeSpaces(telesyRender(data)), expected);
    });

    it("demo-table.html", () => {
        const html = fs.readFileSync(`${__dirname}/../benchmark/demo-table.html`, "utf-8");
        const render = compile(html);
        assert.equal(removeSpaces(render(data)), expected);
    });
});
