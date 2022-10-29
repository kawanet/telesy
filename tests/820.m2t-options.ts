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

    it(`{guess: true}`, () => {
        const html = `
        {{# array.length }}
        <ul>
        {{# array }}
        <li>{{.}}</li>
        {{/ array }}
        </ul>
        {{/ array.length }}
        `;
        const normalRender = compile(mustache2telesy(html, {guess: false, trim: true}));
        const betterRender = compile(mustache2telesy(html, {guess: true, trim: true}));
        assert.notEqual(String(betterRender), String(normalRender));

        {
            const data = {};
            assert.equal(normalRender(data), betterRender(data));
        }

        {
            const data = {array: [1, 2, 3]};
            assert.equal(normalRender(data), betterRender(data));
        }
    });

    it(`{boolean: "isFoo"}`, () => {
        const html = `
        {{# foo.isFoo }}
        <span>Foo</span>
        {{/ foo.isFoo }}
        `;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const betterRender = compile(mustache2telesy(html, {trim: true, boolean: "isFoo"}));
        assert.notEqual(String(betterRender), String(normalRender));

        {
            const data = {};
            assert.equal(normalRender(data), betterRender(data));
        }

        {
            const data = {foo: {isFoo: true}};
            assert.equal(normalRender(data), betterRender(data));
        }
    });

    it(`{array: "fooList"}`, () => {
        const html = `
        {{# fooList }}
        <li>{{.}}</li>
        {{/ fooList }}
        `;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const betterRender = compile(mustache2telesy(html, {trim: true, array: "fooList"}));
        assert.notEqual(String(betterRender), String(normalRender));

        {
            const data = {};
            assert.equal(normalRender(data), betterRender(data));
        }

        {
            const data = {fooList: [1, 2, 3]};
            assert.equal(normalRender(data), betterRender(data));
        }
    });
});
