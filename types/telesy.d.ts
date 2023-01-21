/**
 * Telesy
 */

declare namespace Telesy {
    type V = string | number | false | undefined | null | Fragment | Fragment[];

    // A hack to deny the specific union type of the pair of (Fragment | number). Thanks to Tobias S!
    type isNotUnionTypeOfFragmentAndNumber<T> = [T] extends [Exclude<V, number>] ? V : [T] extends [Exclude<V, Fragment>] ? V : never;
    type RestParamsOfV<T extends V[]> = T & { [K in keyof T]: isNotUnionTypeOfFragmentAndNumber<T[K]> };

    interface telesy {
        $$: $$;
        $$$: $$$;
    }

    interface $$ {
        // Template Literals: $$`<div>${v}</div>`
        // (t: TemplateStringsArray, ...args: V[]): string;
        <T extends V[]>(t: TemplateStringsArray, ...args: RestParamsOfV<[...T]>): string;

        // Function Call: $$($$$("<li>${v}</li>"))
        (t: V): string;
    }

    interface $$$ {
        // Template Literals: $$`<ul>${list.map(v => $$$`<li>${v}</li>`)}</ul>`
        // (t: TemplateStringsArray, ...args: V[]): Fragment;
        <T extends V[]>(t: TemplateStringsArray, ...args: RestParamsOfV<[...T]>): Fragment;

        // Function Call: $$$("<li>${v}</li>")
        (t: V): Fragment;
    }

    interface Fragment {
        outerHTML: string;
    }
}

export const $$: Telesy.$$;
export const $$$: Telesy.$$$;
