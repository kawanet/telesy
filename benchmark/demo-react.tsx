import * as React from "react";
import * as ReactDomServer from "react-dom/server";
import {Table} from "./demo-data";

export const render = (ctx: Table.Context) =>
    <table>
        {ctx.rows.map((row, idx) =>
            <tr className={row.className} key={idx}>
                {row.cols.map((col, idx) =>
                    <td className={col.className} key={idx}>{col.v}</td>
                )}
            </tr>
        )}
    </table>;

export const reactRender = (ctx: Table.Context) => ReactDomServer.renderToString(render(ctx));
