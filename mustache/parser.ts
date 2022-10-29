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
        name = trim(name);
        if (name === ".") return this.key;
        return this.key + name.split(".").map((v, idx) => {
            let q = (idx > 0 && !force) ? "?" : "";
            if (/^[_a-zA-Z$][\w$]*$/.test(v)) return `${q}.${v}`;
            if (q) q += ".";
            if (/^\d+$/.test(v)) return `${q}[${v}]`;
            v = v.replace(/(["\\])/g, "\\$1");
            return `${q}["${v}"]`;
        }).join("");
    }
}

export function mustache2telesy(source: string): string {
    const TAG_MAP = {
        "&": ampersandTag,
        "/": closeTag,
        "!": commentTag,
        "^": invertedSectionTag,
        ">": partialTag,
        "#": sectionTag,
        "{": trippeMustacheTag
    } as { [tag: string]: (str: string) => void };

    const regexp = "{{([^{}]*|{[^{}]*})}}";
    const array = String(source).split(new RegExp(regexp));

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
     * Telesy:   ${ variable }
     */
    function addVariable(str: string): void {
        buffer.push("${" + layer.variable(str) + "}");
    }

    /*
     * Variable Unescaped
     * Mustache: {{{ variable }}}
     * Telesy:   ${ $$$(vairable) }
     */
    function trippeMustacheTag(str: string): void {
        return ampersandTag(str.substr(0, str.length - 1));
    }

    /*
     * Mustache: {{& variable }}
     * Telesy:   ${ $$$(vairable) }
     */
    function ampersandTag(str: string): void {
        buffer.push("${$$$(" + layer.variable(str) + ")}");
    }

    /**
     * Partial tag
     * Mustache: {{> partial }}
     * Telesy:   ${ partial }
     */
    function partialTag(str: string): void {
        buffer.push("${" + layer.variable(str) + "}");
    }

    /**
     * Conditional Section
     * Mustache: {{# boolean }}...{{/ boolean }}
     * Telesy:   ${ !!boolean && $$$`...`} }
     *
     * Loop Section
     * Mustache: {{# array }}...{{/ array }}
     * Telesy:   ${ array.map(a => $$$`...`) } }
     *
     * Then
     * Mustache: {{# v }}...{{/ v }}
     * Telesy:   ${ !!v && (Array.isArray(v) ? v : [v]).map(a => $$$`...`) }
     */
    function sectionTag(str: string): void {
        const current = layer.variable(str); // => v.obj?.obj?.key
        const force = layer.variable(str, true); // => v.obj.obj.key
        const parent = layer.key;
        layer = layer.push(str, "`) }", true);
        const child = layer.key;
        buffer.push(`\${ !!${current} && (Array.isArray(${force}) ? ${force} : [${parent}]).map(${child} => \$\$\$\``);
    }

    /**
     * Inverted Section
     * Mustache: {{# boolean }}...{{/ boolean }}
     * Telesy:   ${ !boolean && $$$`...` }
     */
    function invertedSectionTag(str: string): void {
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
}

/**
 * @private
 */

function trim(str: string) {
    return str.replace(/^\s+/, "").replace(/\s+$/, "");
}