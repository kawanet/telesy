#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import * as Hogan from "hogan.js";
import * as Mustatte from "mustatte";

import {$$, $$$} from "../";
import {mustache2telesy} from "../mustache/parser";
import {telesyRender} from "../benchmark/demo-telesy";
import {demoData} from "../benchmark/demo-data";
import {commonTagsRender} from "../benchmark/demo-common-tags";
import {reactRender} from "../benchmark/demo-react";

const TITLE = __filename.split("/").pop()!;

const compile = (source: string) => Function("$$", "$$$", "return " + mustache2telesy(source))($$, $$$);

const removeSpaces = (s: string) => s.replace(/(>)\s+|\s+(<)/g, "$1$2");

const expected = `<table><tr class="row"><td class="col">0</td></tr></table>`;

describe(TITLE, () => {
    const data = demoData(1);
    const html = fs.readFileSync(`${__dirname}/../benchmark/demo-table.html`, "utf-8");

    it("telesy", () => {
        assert.equal(removeSpaces(telesyRender(data)), expected);
    });

    it("mustache2telesy", () => {
        const render = compile(html);
        assert.equal(removeSpaces(render(data)), expected);
    });

    /**
     * Tests below are NOT for Telesy itself but for benchmark CLI.
     */

    it("common-tags", () => {
        assert.equal(removeSpaces(commonTagsRender(data)), expected);
    });

    it("React", () => {
        assert.equal(removeSpaces(reactRender(data)), expected);
    });

    it("Mustatte", () => {
        const mustatteRender = Mustatte.compile(html);
        assert.equal(removeSpaces(mustatteRender(data)), expected);
    });

    it("Hogan.js", () => {
        const hoganRender = Hogan.compile(html);
        assert.equal(removeSpaces(hoganRender.render(data)), expected);
    });

    it("Handlebars", () => {
        const handlebarsRender = Handlebars.compile(html);
        assert.equal(removeSpaces(handlebarsRender(data)), expected);
    });
});
