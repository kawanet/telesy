#!/usr/bin/env node

import * as fs from "fs";
import {mustache2telesy} from "./parser";

CLI(process.stdout);

function CLI(stream: { write(str: string): any }) {
    // @see https://tc39.es/ecma262/#sec-keywords-and-reserved-words
    const reservedWords = `await break case catch class const continue debugger default delete do
    else enum export extends false finally for function if import in instanceof new null return
    super switch this throw true try typeof var void while with yield
    enum implements interface package private protected public arguments eval`;

    const check: { [name: string]: number } = {};
    reservedWords.split(/\W+/).forEach(v => check[v] = 0);

    const args = process.argv.slice(2);

    if (!args.length) {
        const cmd = process.argv[1]!.split("/").pop();
        console.error(`Usage: ${cmd} --trim --guess templates/*.html > templates.ts`);
        console.error(`Usage: ${cmd} --trim --array="items,itemList" --bool="isHidden,selected" templates/*.html > templates.ts`);
        return;
    }

    stream.write(`import {$$, $$$} from "telesy";\n\n`);

    const options: { [key: string]: boolean | string } = {};

    for (const arg of args) {
        if (/^--\w/.test(arg)) {
            const eq = arg.slice(2).split("=", 2);
            if (eq.length === 1) {
                options[eq[0]] = true;
            } else {
                options[eq[0]] = eq[1];
            }
            continue;
        }

        let source = fs.readFileSync(arg, "utf-8");
        source = source.replace(/^\s+/mg, "").replace(/\s+\n/g, "\n");

        let name = arg.split("/").pop()?.split(".").shift()?.replace(/\W/g, "_")!;
        if (check[name] == null) {
            check[name] = 1;
        } else {
            const prefix = name;
            while (check[name = `${prefix}_${++check[name]}`]) {
                //
            }
            check[name] = 0;
        }

        const code = mustache2telesy(source, options);

        // @see https://www.jetbrains.com/help/idea/using-language-injections.html#use-language-injection-comments
        if (/\.html$/.test(arg)) {
            stream.write(`// language=HTML\n`);
        }

        stream.write(`export const ${name} = ${code};\n\n`);
    }
}
