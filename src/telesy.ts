/**
 * Telesy
 */

type EscapeFn = (str: string) => string;

const AMP = {"<": "&lt;", "&": "&amp;", ">": "&gt;", '"': "&quot;", "'": "&apos;"};

const escapeHTML: EscapeFn = v => v.replace(/([<&>"'])/g, ($1: keyof typeof AMP) => AMP[$1]);

const isTemplateStringsArray = (v: any): v is TemplateStringsArray => (v && v.raw && (v.raw.length > 0));

const isFragment = (v: any): v is Telesy.Fragment => ("string" === typeof (v as Telesy.Fragment).outerHTML);

const makeTelesy = (escapeFn: EscapeFn): Telesy.telesy => {

    type Stringify = (v: Telesy.V) => string;

    // stringify function with escaping feature
    const stringify$$: Stringify = v => {
        if ("string" === typeof v) {
            return escapeFn(v);
        } else if (v == null || v === false) {
            return "";
        }

        if (isFragment(v)) {
            return v.outerHTML;
        } else if (Array.isArray(v)) {
            return v.map(stringify$$).join(""); // recursive call
        } else {
            return escapeFn(String(v));
        }
    };

    // stringify function without escaping feature
    const stringify$$$: Stringify = v => {
        if ("string" === typeof v) {
            return v;
        } else if (v == null || v === false) {
            return "";
        }

        if (isFragment(v)) {
            return v.outerHTML;
        } else if (Array.isArray(v)) {
            return v.map(stringify$$$).join(""); // recursive call
        } else {
            return String(v);
        }
    };

    // template literals
    const tag$$ = (t: TemplateStringsArray, args: [any, ...string[]]): string => {
        const size = t.length;
        if (size === 1) {
            return t[0];
        } else if (size === 2) {
            return t[0] + stringify$$(args[1]) + t[1];
        } else if (size === 3) {
            return t[0] + stringify$$(args[1]) + t[1] + stringify$$(args[2]) + t[2];
        } else {
            let str = t[0];
            for (let i = 1; i < size; i++) {
                str += stringify$$(args[i]);
                str += t[i];
            }
            return str;
        }
    };

    const $$: Telesy.$$ = function (t) {
        if (isTemplateStringsArray(t)) {
            // Template Literals: $$`<div>${v}</div>`
            return tag$$(t, arguments as any);
        } else {
            // Function Call: $$($$$("<li>${v}</li>"))
            return stringify$$(t);
        }
    };

    const $$$: Telesy.$$$ = function (t) {
        if (isTemplateStringsArray(t)) {
            // Template Literals: $$`<div>${v}</div>`
            t = tag$$(t, arguments as any);
        } else {
            // Function Call: $$($$$("<li>${v}</li>"))
            t = stringify$$$(t);
        }

        return {outerHTML: t, toString};
    };

    return {$$, $$$};
}

function toString(this: Telesy.Fragment) {
    return this.outerHTML;
}

export const {$$, $$$} = makeTelesy(escapeHTML);
