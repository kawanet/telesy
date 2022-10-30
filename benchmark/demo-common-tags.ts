import type {Table} from "./demo-data";
import {html} from "common-tags";

/**
 * common-tags's html`` tag would simply cause XSS (cross site scripting) per default.
 * Programmers break need to use safeHtml`` tag very carefully for dirty data.
 * The benchmark below uses html`` tag, because nested safeHtml`` tag breaks even safe HTML.
 *
 * @see https://www.npmjs.com/package/common-tags
 */

// language=HTML
export const commonTagsRender = (ctx: Table.Context) => html`
    <table>
        ${ctx.rows.map(row => html`
            <tr class="${row.className}">
                ${row.cols.map(col => html`
                    <td class="${col.className}">${col.v}</td>
                `)}
            </tr>
        `)}
    </table>
`;
