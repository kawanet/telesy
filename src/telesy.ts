/**
 * Telesy
 */

import type {Telesy} from "../";

type Stringify = (v: Telesy.V) => string;
type TemplateArgments = [TemplateStringsArray, ...Telesy.V[]];
type EscapeFn = (str: string) => string;

const AMP = {"<": "&lt;", "&": "&amp;", ">": "&gt;", '"': "&quot;", "'": "&apos;"};

const escapeHTML: EscapeFn = v => v.replace(/([<&>"'])/g, ($1: keyof typeof AMP) => AMP[$1]);

const isTemplateStringsArray = (v: any): v is TemplateStringsArray => (v && v.raw && (v.raw.length > 0));

const isFragment = (v: any): v is Telesy.Fragment => ("string" === typeof v.outerHTML);

const toString = function (this: Telesy.Fragment) {
    return this.outerHTML;
};

const makeTelesy = (escapeFn: EscapeFn): Telesy.telesy => {

    // stringify function with escaping feature
    const stringify$$: Stringify = v => {
        if ("string" === typeof v) {
            return escapeFn(v);
        } else if ("number" === typeof v) {
            return escapeFn(String(v));
        } else if (v == null || v === false) {
            return "";
        } else if (isFragment(v)) {
            return v.outerHTML;
        } else if (Array.isArray(v)) {
            return v.map(stringify$$).join(""); // recursive call
        } else {
            return escapeFn(String(v)); // default behaviour
        }
    };

    // stringify function without escaping feature
    const stringify$$$: Stringify = v => {
        if ("string" === typeof v) {
            return v;
        } else if ("number" === typeof v) {
            return String(v);
        } else if (v == null || v === false) {
            return "";
        } else if (isFragment(v)) {
            return v.outerHTML;
        } else if (Array.isArray(v)) {
            return v.map(stringify$$$).join(""); // recursive call
        } else {
            return String(v); // default behaviour
        }
    };

    // template literals
    const tag$$ = (t: TemplateStringsArray, args: TemplateArgments): string => {
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
                str += stringify$$(args[i] as Telesy.V);
                str += t[i];
            }
            return str;
        }
    };

    const $$ = function (t: TemplateStringsArray | string) {
        if (isTemplateStringsArray(t)) {
            // Template Literals: $$`<div>${v}</div>`
            return tag$$(t, arguments as any as TemplateArgments);
        } else {
            // Function Call: $$($$$("<li>${v}</li>"))
            return stringify$$(t);
        }
    } as Telesy.$$;

    const $$$ = function (t: TemplateStringsArray | string) {
        if (isTemplateStringsArray(t)) {
            // Template Literals: $$$`<div>${v}</div>`
            t = tag$$(t, arguments as any as TemplateArgments);
        } else {
            // Function Call: $$($$$("<li>${v}</li>"))
            t = stringify$$$(t);
        }

        return {outerHTML: t, toString};
    } as Telesy.$$$;

    return {$$, $$$};
}

export const {$$, $$$} = makeTelesy(escapeHTML);
