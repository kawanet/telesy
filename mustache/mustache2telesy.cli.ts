#!/usr/bin/env node

import * as fs from "fs";
import {mustache2telesy} from "./parser";

CLI(process.stdout);

function CLI(stream: { write(str: string): any }) {
    stream.write(`import {$$, $$$} from "telesy";\n\n`);

    // @see https://tc39.es/ecma262/#sec-keywords-and-reserved-words
    const reservedWords = `await break case catch class const continue debugger default delete do
    else enum export extends false finally for function if import in instanceof new null return
    super switch this throw true try typeof var void while with yield
    enum implements interface package private protected public arguments eval`;

    const check: { [name: string]: number } = {};
    reservedWords.split(/\W+/).forEach(v => check[v] = 0);

    const files = process.argv.slice(2);

    if (!files.length) {
        const cmd = process.argv.at(1)!.split("/").at(-1);
        console.error(`Usage: ${cmd} mustache-template.html ... > templates.ts`);
    }

    for (const file of files) {
        let source = fs.readFileSync(file, "utf-8");
        source = source.replace(/^\s+/mg, "").replace(/\s+\n/g, "\n");

        let name = file.split("/").pop()?.split(".").shift()?.replace(/\W/g, "_")!;
        if (check[name] == null) {
            check[name] = 1;
        } else {
            const prefix = name;
            while (check[name = `${prefix}_${++check[name]}`]) {
                //
            }
            check[name] = 0;
        }

        const code = mustache2telesy(source);

        if (/\.html$/.test(file)) {
            stream.write(`//language=HTML\n`);
        }

        stream.write(`export const ${name} = ${code};\n\n`);
    }
}
