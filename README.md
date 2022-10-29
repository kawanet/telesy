# Telesy - Simple Type Safe HTML Templating Library using Template Literals

[![Node.js CI](https://github.com/kawanet/telesy/workflows/Node.js%20CI/badge.svg?branch=main)](https://github.com/kawanet/telesy/actions/)
[![npm version](https://img.shields.io/npm/v/telesy)](https://www.npmjs.com/package/telesy)

- We love TypeScript. Telesy allows HTML templates the type checking safety.
- No compilation build phase needed. Telesy just works on any ES6 compliant [web browsers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#browser_compatibility) natively.
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

ES6 JavaScript

```typescript
const {$$, $$$} = require("telesy");

// language=HTML
const selectRender = ctx => $$`
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

HTML elements escaped per default:

```js
const render = (ctx) => $$`<p>${ctx.html}</p>`;

render({html: 'first line<br>second line'}); // => '<p>first line＆lt;br＆gt;second line</p>'
```

HTML unescaped with `$$$` like `dangerouslySetInnerHTML` does:

```js
const render = (ctx) => $$`<p>${$$$(ctx.html)}</p>`;

render({html: 'first line<br>second line'}) // => '<p>first line<br>second line</p>'
```

Conditional section for string:

```js
const render = (ctx) => $$`<div class="${(ctx.value >= 10) && 'is-many'}">${ctx.value}</div>`;

render({value: 10}); // => '<div class="is-many">10</div>'
```

Conditional section for HTML elements:

```js
const render = (ctx) => $$`<div>${!ctx.hidden && $$$`<img src="${ctx.src}">`}</div>`;

render({src: "https://example.com/image.png", hidden: false}); // => '<div><img src="https://example.com/image.png"></div>'
```

Loop sections:

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

Note that `null`, `undefined` and `false` values are just ignored to enable the sections feature described above.
The boolean values are not allowed within the template literals, then. Specify strings to output explicitly, instead.

```js
// DON'T
const render = (ctx) => $$`<span>${ctx.bool}</span>`;
render({bool: false}); // => '<span></span>' (the false value is ignored)

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

## FRAGMENT

- Template literal with `$$` tag returns a plain string.
- Template literal with `$$$` tag returns an encapsulated Fragment object as below.
- Function call `$$(string)` returns an HTML escaped string.
- Function call `$$(fragment)` returns a raw string for the `fragment` given.
- Function call `$$$(string)` returns a Fragment object for the `string` given, vice versa.

```typescript
interface Fragment {
    outerHTML: string;
}
```

## BENCHMARKS

| Library                                                   | Type Check | Ops/Sec | Note                                      |
|-----------------------------------------------------------|------------|---------|-------------------------------------------|
| **Telesy**                                                | ✅ Safe    | 42,388  | Backed by the native template literals    |
| [React](https://www.npmjs.com/package/react-dom)          | ✅ Safe    | 4,302   | `ReactDomServer.renderToString()` is slow |
| [Mustatte](https://www.npmjs.com/package/mustatte)        | ❌ N/A     | 82,726  | Fastest but type check **NOT** supported  |
| [Hogan.js](https://www.npmjs.com/package/hogan.js)        | ❌ N/A     | 79,518  | Last publish: 8 years ago                 |
| [Handlebars.js](https://www.npmjs.com/package/handlebars) | ❌ N/A     | 56,307  | A popular Mustache library                |

## MUSTACHE MIGRATION

If your project has good old [Mustache templates](http://mustache.github.io/),
use the bundled CLI command `mustache2telesy` to migrate from Mustache to Telesy.

```sh
./node_modules/.bin/mustache2telesy --trim --guess templates/*.html > templates.ts

./node_modules/.bin/mustache2telesy --trim --array="items,itemList" --bool="isHidden,selected" templates/*.html > templates.ts
```

Most of Mustache's basic features would just get transformed by `mustache2telesy`,
except for some use cases such as lambda function calls.
TypeScript's type checking would help you to fix them easily.

## LINKS

- https://github.com/kawanet/telesy
- https://www.npmjs.co/package/telesy
