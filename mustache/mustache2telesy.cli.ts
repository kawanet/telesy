#!/usr/bin/env node

import * as fs from "fs";
import {mustache2telesy} from "./parser";

CLI(process.stdout);

function CLI(stream: { write(str: string): any }) {
    stream.write(`import {$$, $$$} from "telesy";\n\n`);

    const files = process.argv.slice(2);

    if (!files.length) {
        const cmd = process.argv.at(1)!.split("/").at(-1);
        console.error(`Usage: ${cmd} mustache-template.html ... > templates.ts`);
    }

    for (const file of files) {
        let source = fs.readFileSync(file, "utf-8");
        source = source.replace(/^\s+/mg, "").replace(/\s+\n/g, "\n");

        const name = file.split("/").pop()?.split(".").shift()?.replace(/\W/g, "_");

        const code = mustache2telesy(source);

        if (/\.html$/.test(file)) {
            stream.write(`//language=HTML\n`);
        }

        stream.write(`export const ${name} = ${code};\n\n`);
    }
}
