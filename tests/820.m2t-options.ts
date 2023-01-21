#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {$$, $$$} from "../";
import {mustache2telesy} from "../mustache/parser";

const TITLE = __filename.split("/").pop()!;

const compile = (source: string) => Function("$$", "$$$", "return " + source)($$, $$$);

describe(TITLE, () => {
    it(`{trim: true}`, () => {
        const html = `
        {{# bool }}
        <span>Hi!</span>
        {{/ bool }}
        `;

        const normalRender = compile(mustache2telesy(html));
        const optionRender = compile(mustache2telesy(html, {trim: true}));
        assert.match(String(normalRender), /\$\$`\s+\$\{/);
        assert.match(String(optionRender), /\$\$`\$\{/);

        {
            const data = {};
            assert.match(normalRender(data), /^\s+$/);
            assert.match(optionRender(data), /^$/);
        }

        {
            const data = {bool: true};
            assert.match(normalRender(data), /^\s+<span>Hi!<\/span>\s+$/);
            assert.equal(optionRender(data), `<span>Hi!</span>`);
        }
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
        const optionRender = compile(mustache2telesy(html, {guess: true, trim: true}));
        assert.match(String(normalRender), /Array.isArray/);
        assert.doesNotMatch(String(optionRender), /Array.isArray/);

        {
            const data = {};
            assert.equal(normalRender(data), optionRender(data));
        }

        {
            const data = {array: [1, 2, 3]};
            assert.equal(normalRender(data), optionRender(data));
        }
    });

    it(`{guess: true} (Object)`, () => {
        const html = `
        <span>{{ foo.bar.buz }}</span>
        {{# foo.bar }}
        <span>{{ qux }}</span>
        {{/ foo.bar }}
        `;

        const normalRender = compile(mustache2telesy(html, {trim: true, guess: false}));
        const optionRender = compile(mustache2telesy(html, {trim: true, guess: true}));
        assert.match(String(normalRender), /Array.isArray/);
        assert.doesNotMatch(String(optionRender), /Array.isArray/);

        {
            const data = {};
            assert.equal(normalRender(data), optionRender(data));
        }

        {
            const data = {foo: {bar: {buz: "BUZ", qux: "QUX"}}};
            assert.equal(normalRender(data), optionRender(data));
        }
    });

    it(`{guess: true} (Function)`, () => {
        const html = `<span>{{ foo.toString }}</span>`;
        const normalRender = compile(mustache2telesy(html, {trim: true, guess: false}));
        const optionRender = compile(mustache2telesy(html, {trim: true, guess: true}));

        assert.ok(!/\.toString\(\)/.test(normalRender), `function not detected without {guess: true}`);
        assert.ok(/\.toString\(\)/.test(optionRender), `function detected with {guess: true}`);

        {
            const data = {};
            assert.equal(normalRender(data), `<span></span>`);
            assert.equal(optionRender(data), `<span></span>`);
        }

        {
            const data = {foo: {toString: () => "FOO"}};
            assert.equal(optionRender(data), `<span>FOO</span>`);
        }
    });

    it(`{boolean: "isFoo"}`, () => {
        const html = `<span>{{# foo.isFoo }}Foo{{/ foo.isFoo }}</span>`;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const optionRender = compile(mustache2telesy(html, {trim: true, boolean: "isFoo"}));
        assert.match(String(normalRender), /Array.isArray/);
        assert.doesNotMatch(String(optionRender), /Array.isArray/);

        {
            const data = {};
            assert.equal(normalRender(data), `<span></span>`);
            assert.equal(optionRender(data), `<span></span>`);
        }

        {
            const data = {foo: {isFoo: true}};
            assert.equal(normalRender(data), `<span>Foo</span>`);
            assert.equal(optionRender(data), `<span>Foo</span>`);
        }
    });

    it(`{array: "fooList"}`, () => {
        const html = `<ul>{{# fooList }}<li>{{.}}</li>{{/ fooList }}</ul>`;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const optionRender = compile(mustache2telesy(html, {trim: true, array: "fooList"}));
        assert.match(String(normalRender), /Array.isArray/);
        assert.doesNotMatch(String(optionRender), /Array.isArray/);

        {
            const data = {};
            assert.equal(normalRender(data), `<ul></ul>`);
            assert.equal(optionRender(data), `<ul></ul>`);
        }

        {
            const data = {fooList: [1, 2, 3]};
            const expected = `<ul><li>1</li><li>2</li><li>3</li></ul>`;
            assert.equal(normalRender(data), expected);
            assert.equal(optionRender(data), expected);
        }
    });

    it(`{object: "bar"}`, () => {
        const html = `<span>{{# foo.bar }}{{buz}}{{/ foo.bar }}</span>`;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const optionRender = compile(mustache2telesy(html, {trim: true, object: "bar"}));
        assert.match(String(normalRender), /Array.isArray/);
        assert.doesNotMatch(String(optionRender), /Array.isArray/);

        {
            const data = {};
            assert.equal(normalRender(data), `<span></span>`);
            assert.equal(optionRender(data), `<span></span>`);
        }

        {
            const data = {foo: {bar: true}, buz: "YYY"};
            assert.equal(normalRender(data), `<span>YYY</span>`);
            assert.equal(optionRender(data), `<span></span>`);
        }

        {
            const data = {foo: {bar: {buz: "XXX"}}, buz: "YYY"};
            assert.equal(normalRender(data), `<span>XXX</span>`);
            assert.equal(optionRender(data), `<span>XXX</span>`);
        }
    });

    it(`{func: "getText"}`, () => {
        const html = `<span>{{ foo.getText }}</span>`;
        const normalRender = compile(mustache2telesy(html, {trim: true}));
        const optionRender = compile(mustache2telesy(html, {trim: true, func: "getText"}));
        assert.doesNotMatch(String(normalRender), /\.getText\(\)/);
        assert.match(String(optionRender), /\.getText\(\)/);

        {
            const data = {};
            assert.equal(normalRender(data), `<span></span>`);
            assert.equal(optionRender(data), `<span></span>`);
        }
        {
            const data = {foo: {getText: () => "FOO"}};
            assert.notEqual(normalRender(data), `<span>FOO</span>`);
            assert.equal(optionRender(data), `<span>FOO</span>`);
        }
    });

    it(`{root: "foo"}`, () => {
        const html = `<span>{{#array}}{{foo}}{{/array}}</span>`;
        const normalRender = compile(mustache2telesy(html, {trim: true, array: "array"}));
        const optionRender = compile(mustache2telesy(html, {trim: true, array: "array", root: "foo"}));
        assert.doesNotMatch(String(normalRender), /v\.foo/);
        assert.match(String(optionRender), /v\.foo/);

        {
            const data = {foo: "Foo", array: [{foo: "Bar"}]};
            assert.equal(normalRender(data), `<span>Bar</span>`);
            assert.equal(optionRender(data), `<span>Foo</span>`);
        }
    });

    it(`{root: "foo", array: "foo"}`, () => {
        const html = `<span>{{#array}}{{#foo}}{{bar}}{{/foo}}{{/array}}</span>`;
        const normalRender = compile(mustache2telesy(html, {trim: true, array: "array,foo"}));
        const optionRender = compile(mustache2telesy(html, {trim: true, array: "array,foo", root: "foo"}));
        assert.doesNotMatch(String(normalRender), /v\.foo/);
        assert.match(String(optionRender), /v\.foo/);

        {
            const data = {array: [{foo: [{bar: "in-array"}]}], foo: [{bar: "on-root"}]};
            assert.equal(normalRender(data), `<span>in-array</span>`);
            assert.equal(optionRender(data), `<span>on-root</span>`);
        }
    });
});
