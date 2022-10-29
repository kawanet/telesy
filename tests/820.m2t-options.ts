#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {$$, $$$} from "../";
import {mustache2telesy} from "../mustache/parser";

const TITLE = __filename.split("/").pop()!;

const compile = (source: string) => Function("$$", "$$$", "return " + source)($$, $$$);

const removeSpaces = (s: string) => s.replace(/(>)\s+|\s+(<)/g, "$1$2");

describe(TITLE, () => {
    it(`{trim: true}`, () => {
        const html = `
        {{# bool }}
        <span>Hi!</span>
        {{/ bool }}
        `;
        const normalRender = compile(mustache2telesy(html));
        const betterRender = compile(mustache2telesy(html, {trim: true}));
        assert.notEqual(String(betterRender), String(normalRender));

        const normalResult = normalRender({bool: true});
        const trimedResult = betterRender({bool: true});
        assert.notEqual(trimedResult, normalResult);
        assert.equal(removeSpaces(trimedResult), removeSpaces(normalResult));
    });
});
