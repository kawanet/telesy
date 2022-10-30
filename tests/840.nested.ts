#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {$$, $$$} from "../";
import {mustache2telesy} from "../mustache/parser";

const TITLE = __filename.split("/").pop()!;

const compile = (source: string) => Function("$$", "$$$", "return " + source)($$, $$$);

describe(TITLE, () => {
    it("nested", () => {
        const html = `
        {{# www }}
        {{# xxx }}
        {{# yyy }}
        {{# zzz }}
        {{# aaa }}
        <span>{{.}}</span>
        {{/ aaa }}
        {{/ zzz }}
        {{/ yyy }}
        {{/ xxx }}
        {{/ www }}
        `;
        const source = mustache2telesy(html, {trim: true, array: "vvv,www,xxx,yyy,zzz,aaa"})
        assert.match(source, /\.map\(w => /);
        assert.match(source, /\.map\(x => /);
        assert.match(source, /\.map\(y => /);
        assert.match(source, /\.map\(z => /);
        assert.match(source, /\.map\(a => /);

        const render = compile(source);
        assert.equal(render({}), "");

        const data = {
            www: [{
                xxx: [{
                    yyy: [{
                        zzz: [{
                            aaa: ["AAA"]
                        }]
                    }]
                }]
            }]
        };
        assert.match(render(data), /<span>AAA<\/span>/);
    });
});
