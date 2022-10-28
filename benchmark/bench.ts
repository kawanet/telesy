#!/usr/bin/env node

import {strict as assert} from "assert";
import * as Benchmark from "benchmark";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import * as Hogan from "hogan.js";
import * as Mustatte from "mustatte";

import {demoData} from "./demo-data";
import {telesyRender} from "./demo-telesy";
import {reactRender} from "./demo-react";

const source = fs.readFileSync(`${__dirname}/demo-table.html`, "utf-8");
const mustatteRender = Mustatte.compile(source);
const hoganRender = Hogan.compile(source);
const handlebarsRender = Handlebars.compile(source);

const expected = `<table><tr class="row"><td class="col">0</td></tr></table>`;
const removeSpaces = (s: string) => s.replace(/(>)\s+|\s+(<)/g, "$1$2");
const miniData = demoData(1);

assert.equal(removeSpaces(telesyRender(miniData)), expected, "telesy");
assert.equal(removeSpaces(reactRender(miniData)), expected, "react");
assert.equal(removeSpaces(mustatteRender(miniData)), expected, "mustatte");
assert.equal(removeSpaces(hoganRender.render(miniData)), expected, "hogan.js");
assert.equal(removeSpaces(handlebarsRender(miniData)), expected, "handlebars");

const suite = new Benchmark.Suite();
const moreData = demoData(10);

suite.add("telesy", () => telesyRender(moreData));
suite.add("react", () => reactRender(moreData));
suite.add("mustatte", () => mustatteRender(moreData));
suite.add("hogan.js", () => hoganRender.render(moreData));
suite.add("handlebars", () => handlebarsRender(moreData));

suite.on("complete", function (this: Benchmark.Suite) {
    const name = this.filter("fastest").map("name");
    console.log(`Fastest is ${name}`);
});

suite.on("cycle", (event: Event) => console.log(String(event.target)));

suite.run({async: true});
