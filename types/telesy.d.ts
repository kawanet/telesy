/**
 * Telesy
 */

declare namespace Telesy {
    type V = string | number | false | undefined | null | Fragment | Fragment[];

    // A hack to deny the specific pairs in union types. Thanks to Tobias S!
    // This denies ${ list.length && list.map(v=>$$$`fragment`) } which may cause the unexpected result "0".
    // Use ${ !!list.length && list.map(v=>$$$`fragment`) } instead.
    type checkFragments<T, X> = [T] extends [Exclude<V, number>] ? X : [T] extends [Exclude<V, Fragment[]>] ? X : never;

    type checkParam<T> = checkFragments<T, V>;
    type Params<T extends V[]> = T & { [K in keyof T]: checkParam<T[K]> };

    interface telesy {
        $$: $$;
        $$$: $$$;
    }

    interface $$ {
        // Template Literals: $$`<div>${v}</div>`
        // (t: TemplateStringsArray, ...args: V[]): string;
        <T extends V[]>(t: TemplateStringsArray, ...args: Params<[...T]>): string;

        // Function Call: $$($$$("<li>${v}</li>"))
        (t: V): string;
    }

    interface $$$ {
        // Template Literals: $$`<ul>${list.map(v => $$$`<li>${v}</li>`)}</ul>`
        // (t: TemplateStringsArray, ...args: V[]): Fragment;
        <T extends V[]>(t: TemplateStringsArray, ...args: Params<[...T]>): Fragment;

        // Function Call: $$$("<li>${v}</li>")
        (t: V): Fragment;
    }

    interface Fragment {
        outerHTML: string;
    }
}

export const $$: Telesy.$$;
export const $$$: Telesy.$$$;
