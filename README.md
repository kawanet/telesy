# Telesy - Type Safe HTML Templating Library using Template Literals

[![Node.js CI](https://github.com/kawanet/telesy/workflows/Node.js%20CI/badge.svg?branch=main)](https://github.com/kawanet/telesy/actions/)
[![npm version](https://img.shields.io/npm/v/telesy)](https://www.npmjs.com/package/telesy)

- We love TypeScript. Telesy gives the type safe for HTML templates.
- No compilation build phase needed. Telesy just works natively on any ES6 compliant [web browsers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#browser_compatibility) and Node.js.
- 10 times faster than `ReactDomServer.renderToString()` to generate static HTML code.
- Lightweight. Less than 1KB when minified. No additional dependencies.

## SYNOPSIS

TypeScript

```typescript
import {$$, $$$} from "telesy";

interface Context {
    name: string;
    options: Option[];
}

interface Option {
    value: string;
    selected: string;
    label: string;
}

// language=HTML
const selectRender = (ctx: Context) => $$`
    <select name="${ctx.name}">
        ${ctx.options.map(v => $$$`<option value="${v.value}" ${v.selected}>${v.label}</option>`)}
    </select>
`;

document.querySelector<HTMLElement>("#here").innerHTML = selectRender(context);
```

JavaScript (ES6)

```js
const {$$, $$$} = require("telesy");

// language=HTML
const selectRender = (ctx) => $$`
    <select name="${ctx.name}">
        ${ctx.options.map(v => $$$`<option value="${v.value}" ${v.selected}>${v.label}</option>`)}
    </select>
`;

document.querySelector("#here").innerHTML = selectRender(context);
```

## USAGE

See [telesy.d.ts](https://github.com/kawanet/telesy/blob/main/types/telesy.d.ts) for detail.

Template variables:

```js
const render = (ctx) => $$`<p>Hello, ${ctx.name}!</p>`;

render({name: "Ken"}); // => '<p>Hello, Ken!</p>'
```

HTML special characters escaped per default for safe:

```js
const render = (ctx) => $$`<p>${ctx.html}</p>`;

render({html: 'first line<br>second line'}); // => '<p>first line＆lt;br＆gt;second line</p>'
```

HTML special characters unescaped with `$$$` filter function like `dangerouslySetInnerHTML` does:

```js
const render = (ctx) => $$`<p>${$$$(ctx.html)}</p>`;

render({html: 'first line<br>second line'}) // => '<p>first line<br>second line</p>'
```

Conditional section for plain string:

```js
const render = (ctx) => $$`<div class="${(ctx.value >= 10) && 'is-many'}">${ctx.value}</div>`;

render({value: 10}); // => '<div class="is-many">10</div>'
```

Conditional section with `$$$` tag template literals for HTML elements:

```js
const render = (ctx) => $$`<div>${!ctx.hidden && $$$`<img src="${ctx.src}">`}</div>`;

render({src: "image.png", hidden: false}); // => '<div><img src="image.png"></div>'
```

Loop sections with nested `$$$` tag template literals:

```js
// language=HTML
const render = (ctx) => $$`
    <table>
        ${ctx.rows.map(row => $$$`
            <tr class="${row.className}">
                ${row.cols.map(col => $$$`
                    <td class="${col.className}">${col.v}</td>
                `)}
            </tr>
        `)}
    </table>
`;
```

## FRAGMENT

- Template literal with `$$` tag returns a plain string.
- Template literal with `$$$` tag returns an encapsulated `Fragment` object as below.
- Function call `$$(string)` returns an HTML escaped string.
- Function call `$$(fragment)` returns a raw string for the `Fragment` object given.
- Function call `$$$(string)` returns a `Fragment` object for the `string` given, vice versa.

```typescript
interface Fragment {
    outerHTML: string;
}
```

## EMPTY VALUES

Telesy accepts `string`, `number` values and `Fragment`s within the template literals.
It outputs empty string `""` when `null`, `undefined` or `false` value is given.
Note that it doesn't accept the primitive `true` value, on the other hand.
Specify strings to output explicitly, instead.

```js
// DON'T
const render = (ctx) => $$`<span>${ctx.bool}</span>`;
render({bool: false}); // => '<span></span>' (the false value cause an empty string)

// DO
const render = (ctx) => $$`<span>${ctx.bool ? "YES" : "NO"}</span>`;
render({bool: true}); // => '<span>YES</span>'
render({bool: false}); // => '<span>NO</span>'
```

```js
// DON'T
const render = (ctx) => $$`<span>${ctx.bool || "it is falsy"}</span>`;
render({bool: false}); // => '<span>it is falsy</span>'

// DO
const render = (ctx) => $$`<span>${!ctx.bool && "it is falsy"}</span>`;
const render = (ctx) => $$`<span>${ctx.bool ? "" : "it is falsy"}</span>`;
render({bool: true}); // => '<span></span>'
render({bool: false}); // => '<span>it is falsy</span>'
```

## BENCHMARKS

Telesy is fast enough but type safe.

| Library                                                   | Type Safe | Ops/Sec | Note                                      |
|-----------------------------------------------------------|------------|---------|-------------------------------------------|
| **Telesy**                                                | ✅ Safe    | 42,389  | Backed by the native template literals    |
| [common-tags](https://www.npmjs.com/package/common-tags)  | ✅ Safe    | 8,323   | Nested `safeHtml` causes trouble          |
| [React](https://www.npmjs.com/package/react-dom)          | ✅ Safe    | 4,278   | `ReactDomServer.renderToString()` is slow |
| [Mustatte](https://www.npmjs.com/package/mustatte)        | ❌ N/A     | 82,442  | Fastest but type safe **NOT** supported   |
| [Hogan.js](https://www.npmjs.com/package/hogan.js)        | ❌ N/A     | 74,087  | Last publish: 8 years ago                 |
| [Handlebars.js](https://www.npmjs.com/package/handlebars) | ❌ N/A     | 54,129  | A popular Mustache library                |

The benchmark result above is on node v18.12.0, Apple Silicon M1.

## MUSTACHE MIGRATION

If your project has good old [Mustache templates](http://mustache.github.io/),
use the bundled CLI command `mustache2telesy` to migrate from Mustache to Telesy.

```sh
# combine multiple template files to a single TypeScript file
./node_modules/.bin/mustache2telesy --trim --guess templates/*.html > templates.ts

# give some hints of property types to get more simple code generated
./node_modules/.bin/mustache2telesy --trim --guess --array="items,itemList" --bool="isHidden,selected" --func="getText" templates/*.html > templates.ts
```

The author is a Mustache user for more than 10 years.
His Mustache-based project was migrated to Telesy/TypeScript just in minutes.

Most of Mustache's basic features would just get transformed by `mustache2telesy`,
except for some use cases such as lambda function calls.
But don't be afraid. TypeScript's type checking would help you to fix them easily, anyway.

## LINKS

- https://github.com/kawanet/telesy
- https://www.npmjs.com/package/telesy
