// parser.ts

class Layer {
    readonly opener: string;
    readonly close: string;
    readonly key: string;
    private readonly parent: Layer;
    private readonly count: number;

    constructor(close: string, opener?: string, parent?: Layer, count?: number) {
        this.opener = opener!;
        this.close = close;
        this.parent = parent!;
        this.count = count = count || 0;
        this.key = ((count + 21) % 26 + 10).toString(36); // v, w, x, y, z, a, b, c,...
    }

    push(name: string, close: string, up: boolean): Layer {
        return new Layer(close, name, this, this.count + (up ? 1 : 0));
    }

    pop(): Layer {
        return this.parent;
    }

    isRoot(): boolean {
        return !this.parent;
    }

    /**
     * v.object?.key
     * v.object?.["other-key"]
     * v.array?.[1]
     */
    variable(name: string, force?: boolean): string {
        return this._variable(this.key, name, !!force);
    }

    /**
     * {{> alt.partials.foo }}
     */
    alt(name: string): string {
        return this._variable("alt", name, false);
    }

    private _variable(parent: string, name: string, force: boolean): string {
        name = trim(name);
        if (name === ".") return parent;
        return parent + name.split(".").map((v, idx) => {
            let q = (idx > 0 && !force) ? "?" : "";
            if (/^[_a-zA-Z$][\w$]*$/.test(v)) return `${q}.${v}`;
            if (q) q += ".";
            if (/^\d+$/.test(v)) return `${q}[${v}]`;
            v = v.replace(/(["\\])/g, "\\$1");
            return `${q}["${v}"]`;
        }).join("");
    }
}

declare namespace M2T {
    interface Option {
        array?: string; // {{# array }}...{{/ array }}
        boolean?: string; // {{# boolean }}...{{/ boolean }}
        guess?: boolean;
        object?: string; // {{# object }}...{{/ object }}
        trim?: boolean;
    }
}

class Vars {
    private index: { [key: string]: boolean };

    constructor(keys: string) {
        const index: typeof this.index = this.index = {}
        keys?.split(/\s*,\s*/).forEach(v => index[v] = !!v);
    }

    add(key: string): void {
        this.index[key] = true;
    }

    match(key: string): boolean {
        const s = key.split(".").pop()!;
        return !!this.index[s] || !!this.index[key];
    }
}

export function mustache2telesy(source: string, option?: M2T.Option): string {
    const TAG_MAP = {
        "&": ampersandTag,
        "/": closeTag,
        "!": commentTag,
        ".": dotTag,
        "^": invertedSectionTag,
        ">": partialTag,
        "#": sectionTag,
        "{": trippeMustacheTag
    } as { [tag: string]: (str: string) => void };

    const regexp = "{{([^{}]*|{[^{}]*})}}";
    const array = String(source).split(new RegExp(regexp));

    const arrayVars = new Vars(option?.array!);
    const boolVars = new Vars(option?.boolean!);
    const objVars = new Vars(option?.object!);

    if (option?.trim) {
        if (/^\s+$/.test(array[0])) {
            array[0] = "";
        }
        if (/^\s+$/.test(array[array.length - 1])) {
            array.pop();
        }
    }

    let layer = new Layer("`");
    const buffer: string[] = ["(" + layer.key + ") => $$`"];

    array.forEach((str, idx) => {
        if (idx & 1) {
            addTag(str);
        } else if (str) {
            addString(str);
        }
    });

    if (!layer.isRoot()) {
        throw new Error("missing closing tag: " + layer.opener);
    }

    buffer.push(layer.close);
    let result = buffer.join("");

    // $$$` <element> `
    if (option?.trim) {
        result = result.replace(/\$\$`\s*(<[^\n`]*>)\s*`/g, "$$$$`$1`");
    }

    // !boolean && $$$`${variable}`
    // !boolean && variable
    result = result.replace(/ && \$\$\$`\$\{([^$`]+|[^{`]+|[^}`]+)}`/g, " && $1");

    // .map(v => $$$`${variable}`)
    // .map(v => $$$(variable))
    result = result.replace(/ => \$\$\$`\$\{([^$`]+|[^{`]+|[^}`]+)}`/g, " => $$$$$$($1)");

    // !boolean && $$$`text`
    // !boolean && `text`
    result = result.replace(/ && \$\$\$(`[^`${}<>&"']*`)/g, " && $1");

    // .map(v => $$$`text`)
    // .map(() => $$$`text`)
    result = result.replace(/\(\w => (\$\$\$`([^$`]+|[^{`]+|[^}`]+)?`)\)/g, "(() => $1)");

    return result;

    function addString(str: string): void {
        buffer.push(str.replace(/(`|\$\{)/g, "\\$1"));
    }

    function addTag(str: string): void {
        const f = TAG_MAP[str[0]];
        if (f) {
            f(trim(str.substr(1)));
        } else {
            addVariable(str);
        }
    }

    /**
     * Variable Escaped
     *
     * Mustache: {{ variable }}
     * Telesy:   ${ v.variable }
     */
    function addVariable(str: string): void {
        registerVar(str);
        buffer.push("${" + layer.variable(str) + "}");
    }

    /*
     * Variable Unescaped
     * Mustache: {{{ variable }}}
     * Telesy:   ${ $$$(v.vairable) }
     */
    function trippeMustacheTag(str: string): void {
        return ampersandTag(str.substr(0, str.length - 1));
    }

    /*
     * Mustache: {{& variable }}
     * Telesy:   ${ $$$(v.vairable) }
     */
    function ampersandTag(str: string): void {
        registerVar(str);
        buffer.push("${$$$(" + layer.variable(str) + ")}");
    }

    /**
     * Mustache: {{. variable }}
     * Telesy:   ${ v.variable }
     */
    function dotTag(str: string): void {
        return addVariable(str || ".");
    }

    /**
     * Partial tag
     * Mustache: {{> partial }}
     * Telesy:   ${ alt.partial }
     */
    function partialTag(str: string): void {
        buffer[0] = buffer[0].replace(/^\((\w+)\)/, "($1, alt)");
        buffer.push("${" + layer.alt(str) + "}");
    }

    /**
     * Section tag
     * Mustache: {{# section }}...{{/ section }}
     */
    function sectionTag(str: string): void {
        registerVar(str);
        const current = layer.variable(str); // => v.obj?.obj?.key

        /**
         * Conditional Section (boolean)
         * Mustache: {{# boolean }}...{{/ boolean }}
         * Telesy:   ${ !!v.boolean && $$$`...`} }
         */
        const isBoolean = boolVars.match(str);
        if (isBoolean) {
            layer = layer.push(str, "` }", false);
            buffer.push(`\${ !!${current} && \$\$\$\``);
            return;
        }

        const force = layer.variable(str, true); // => v.obj.obj.key
        const parent = layer.key;
        layer = layer.push(str, "`) }", true);
        const child = layer.key;

        /**
         * Loop Section
         * Mustache: {{# array }}...{{/ array }}
         * Telesy:   ${ v.array.map(w => $$$`...`) } }
         */
        const isArray = arrayVars.match(str);
        if (isArray) {
            buffer.push(`\${ ${current}?.map(${child} => \$\$\$\``);
            return;
        }

        /**
         * Conditional Section (object)
         * Mustache: {{# object }}...{{/ object }}
         * Telesy:   ${ !!v.object && [v.object].map(w => $$$`...`) } }
         */
        const isObject = objVars.match(str);
        if (isObject) {
            buffer.push(`\${ !!${current} && [${force}].map(${child} => \$\$\$\``);
            return;
        }

        /**
         * On-demand (Mustache's horrible magic)
         * Mustache: {{# key }}...{{/ key }}
         * Telesy:   ${ !!v.key && (Array.isArray(v.key) ? v.key : ("object" === typeof v.key) ? [v.key] : [v]).map(w => $$$`...`) }
         */
        buffer.push(`\${ !!${current} && (Array.isArray(${force}) ? ${force} : ("object" === typeof ${force}) ? [${force}] : [${parent}]).map(${child} => \$\$\$\``);
    }

    /**
     * Inverted Section
     * Mustache: {{# boolean }}...{{/ boolean }}
     * Telesy:   ${ !v.boolean && $$$`...` }
     */
    function invertedSectionTag(str: string): void {
        registerVar(str);
        buffer.push(`\${ !${layer.variable(str)} && \$\$\$\``);
        layer = layer.push(str, "` }", false);
    }

    /**
     * Closing tag
     * Mustache: {{/ variable }}
     */
    function closeTag(str: string): void {
        const tag = layer.opener;
        buffer.push(layer.close);
        layer = layer.pop();
        if (!layer) {
            throw new Error("Closing tag without opener: " + str);
        }
        if (tag !== str) {
            throw new Error("Nesting error: " + tag + " vs. " + str);
        }
    }

    /**
     * Comment
     */
    function commentTag(): void {
        // ignore
    }

    function registerVar(name: string): void {
        if (!option?.guess) return;

        name = trim(name);
        if (name === ".") return;

        if (/\.length$/.test(name)) {
            boolVars.add(name);
            name = name.replace(/\.[^.]+$/, "");
            arrayVars.add(name)
        }

        while (/\./.test(name)) {
            name = name.replace(/\.[^.]+$/, "");
            if (/\.\d+$/.test(name)) break;
            objVars.add(name);
        }
    }
}

/**
 * @private
 */

function trim(str: string) {
    return str.replace(/^\s+/, "").replace(/\s+$/, "");
}