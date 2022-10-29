import type {Table} from "./demo-data";
import {$$, $$$} from "../src/telesy";

// language=HTML
export const telesyRender = (ctx: Table.Context) => $$`
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
