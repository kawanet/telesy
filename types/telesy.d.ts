/**
 * Telesy
 */

declare namespace Telesy {
    type V = string | number | false | undefined | null | Fragment | Fragment[];

    interface telesy {
        $$: $$;
        $$$: $$$;
    }

    interface $$ {
        // Template Literals: $$`<div>${v}</div>`
        (t: TemplateStringsArray, ...args: V[]): string;

        // Function Call: $$($$$("<li>${v}</li>"))
        (t: Fragment): string;
    }

    interface $$$ {
        // Template Literals: $$`<ul>${list.map(v => $$$`<li>${v}</li>`)}</ul>`
        (t: TemplateStringsArray, ...args: V[]): Fragment;

        // Function Call: $$$("<li>${v}</li>")
        (t: string): Fragment;
    }

    interface Fragment {
        outerHTML: string;
    }
}

exports = Telesy.telesy;
