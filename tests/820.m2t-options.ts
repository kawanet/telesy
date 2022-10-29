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

    it(`{guess: true} (Array)`, () => {
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

    it(`{guess: true} (Object)`, () => {
        const html = `
        <span>{{ foo.bar.buz }}</span>
        {{# foo.bar }}
        <span>{{ foo.bar.qux }}</span>
        {{/ foo.bar }}
        `;
        const normalRender = compile(mustache2telesy(html, {trim: true, guess: false}));
        const betterRender = compile(mustache2telesy(html, {trim: true, guess: true}));
        // console.warn(String(betterRender));
        // console.warn(String(normalRender));
        assert.notEqual(String(betterRender), String(normalRender));

        {
            const data = {};
            assert.equal(normalRender(data), betterRender(data));
        }

        {
            const data = {foo: {bar: {buz: "BUZ", qux: "QUX"}}};
            assert.equal(normalRender(data), betterRender(data));
        }
    });

    it(`{cond: "isFoo"}`, () => {
        const html = `
        {{# foo.isFoo }}
        <span>Foo</span>
        {{/ foo.isFoo }}
        `;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const betterRender = compile(mustache2telesy(html, {trim: true, cond: "isFoo"}));
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

    it(`{loop: "fooList"}`, () => {
        const html = `
        {{# fooList }}
        <li>{{.}}</li>
        {{/ fooList }}
        `;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const betterRender = compile(mustache2telesy(html, {trim: true, loop: "fooList"}));
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