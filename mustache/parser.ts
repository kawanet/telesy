// parser.ts

const rootContext = "v";
const altContext = "alt";
const rootOffset = rootContext.charCodeAt(0) - "a".charCodeAt(0);

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
        this.key = ((count + rootOffset) % 26 + 10).toString(36); // v, w, x, y, z, a, b, c,...
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
}

class TypeVars {
    private index: { [key: string]: 1 };

    constructor(keys?: string) {
        const index: typeof this.index = this.index = {};
        keys?.split(/[,\s]+/).forEach(v => (index[v] = 1));
    }

    add(key: string): void {
        this.index[key] = 1;
    }

    match(key: string): boolean {
        const s = key.split(".").pop()!;
        return (this.index[s] === 1) || (this.index[key] === 1);
    }
}

class Vars {
    guess: boolean;
    alt: TypeVars;
    array: TypeVars;
    bool: TypeVars;
    func: TypeVars;
    obj: TypeVars;
    root: TypeVars;

    constructor(option: M2T.Option) {
        this.array = new TypeVars(option.array);
        this.alt = new TypeVars(option.alt);
        this.bool = new TypeVars(option.boolean);
        this.func = new TypeVars(option.func);
        this.obj = new TypeVars(option.object);
        this.root = new TypeVars(option.root);
        this.guess = !!option.guess;
    }

    register(name: string): void {
        if (!this.guess) return;
        name = trim(name);
        if (name === ".") return;

        if (/\.length$/.test(name)) {
            this.bool.add(name);
            name = parentName(name);
            this.array.add(name)
        } else if (/\.(toString|valueOf|toJSON)$/.test(name)) {
            this.func.add(name);
        }

        while (/\./.test(name)) {
            name = parentName(name);
            if (/\.\d+$/.test(name)) break;
            this.obj.add(name);
        }
    }

    parent(layer: Layer, name: string): string {
        return this.alt.match(name) ? altContext : this.root.match(name) ? rootContext : layer.key;
    }

    /**
     * v.object?.key
     * v.object?.["other-key"]
     * v.array?.[1]
     */
    name(parent: string, name: string, safe?: boolean): string {
        name = trim(name);
        if (name === ".") return parent;
        const isFunc = this.func.match(name);

        name = parent + name.split(".").map((v, idx) => {
            let q = (idx > 0 && !safe) ? "?" : "";
            if (/^[_a-zA-Z$][\w$]*$/.test(v)) return `${q}.${v}`;
            if (q) q += ".";
            if (/^\d+$/.test(v)) return `${q}[${v}]`;
            v = v.replace(/(["\\])/g, "\\$1");
            return `${q}["${v}"]`;
        }).join("");

        if (isFunc) name += "()";
        return name;
    }
}

declare namespace M2T {
    interface Option {
        alt?: string;
        array?: string; // {{# array }}...{{/ array }}
        boolean?: string; // {{# boolean }}...{{/ boolean }}
        func?: string; // {{ function }}
        guess?: boolean;
        object?: string; // {{# object }}...{{/ object }}
        root?: string;
        trim?: boolean;
    }
}

export type m2tOptions = M2T.Option;

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
    const vars = new Vars(option || {});

    if (option?.trim) {
        if (/^\s+$/.test(array[0])) {
            array[0] = "";
        }
        if (/^\s+$/.test(array[array.length - 1])) {
            array.pop();
        }
    }

    let layer = new Layer("`");
    let hasAlt = !!option?.alt;
    const buffer: string[] = [];

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

    const args = hasAlt ? `${layer.key}, ${altContext}` : layer.key;
    buffer.unshift("(" + args + ") => $$`");
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
        vars.register(str);
        const parent = vars.parent(layer, str);
        buffer.push("${" + vars.name(parent, str) + "}");
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
        vars.register(str);
        const parent = vars.parent(layer, str);
        buffer.push("${$$$(" + vars.name(parent, str) + ")}");
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
        hasAlt = true;
        buffer.push("${" + vars.name(altContext, str) + "}");
    }

    /**
     * Section tag
     * Mustache: {{# section }}...{{/ section }}
     */
    function sectionTag(str: string): void {
        vars.register(str);
        const parent = vars.parent(layer, str);
        const current = vars.name(parent, str); // => v.obj?.obj?.key

        /**
         * Conditional Section (boolean)
         * Mustache: {{# boolean }}...{{/ boolean }}
         * Telesy:   ${ !!v.boolean && $$$`...` }
         */
        if (vars.bool.match(str)) {
            layer = layer.push(str, "` }", false);
            buffer.push(`\${ !!${current} && \$\$\$\``);
            return;
        }

        const safe = vars.name(parent, str, true); // => v.obj.obj.key
        layer = layer.push(str, "`) }", true);

        const child = layer.key;

        /**
         * Loop Section
         * Mustache: {{# array }}...{{/ array }}
         * Telesy:   ${ v.array?.map(w => $$$`...`) }
         */
        if (vars.array.match(str)) {
            buffer.push(`\${ ${current}?.map(${child} => \$\$\$\``);
            return;
        }

        /**
         * Conditional Section (object)
         * Mustache: {{# object }}...{{/ object }}
         * Telesy:   ${ !!v.object && [v.object].map(w => $$$`...`) }
         */
        if (vars.obj.match(str)) {
            buffer.push(`\${ !!${current} && [${safe}].map(${child} => \$\$\$\``);
            return;
        }

        /**
         * On-demand (Mustache's horrible magic)
         * Mustache: {{# key }}...{{/ key }}
         * Telesy:   ${ !!v.key && (Array.isArray(v.key) ? v.key : ("object" === typeof v.key) ? [v.key] : [v]).map(w => $$$`...`) }
         */
        buffer.push(`\${ !!${current} && (Array.isArray(${safe}) ? ${safe} : ("object" === typeof ${safe}) ? [${safe}] : [${parent}]).map(${child} => \$\$\$\``);
    }

    /**
     * Inverted Section
     * Mustache: {{# boolean }}...{{/ boolean }}
     * Telesy:   ${ !v.boolean && $$$`...` }
     */
    function invertedSectionTag(str: string): void {
        vars.register(str);
        const parent = vars.parent(layer, str);
        buffer.push(`\${ !${vars.name(parent, str)} && \$\$\$\``);
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
}

/**
 * @private
 */

function trim(str: string) {
    return str.replace(/^\s+/, "").replace(/\s+$/, "");
}

function parentName(name: string): string {
    return name.replace(/\.[^.]+$/, "");
}