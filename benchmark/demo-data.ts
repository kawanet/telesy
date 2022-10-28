export declare namespace Table {
    interface Context {
        rows: Row[];
    }

    interface Row {
        className: string;
        cols: Col[];
    }

    interface Col {
        className: string;
        v: number;
    }
}

export const demoData = (limit: number): Table.Context => {
    const cols: Table.Col[] = [];
    for (let i = 0; i < limit; i++) {
        cols.push({className: "col", v: i});
    }

    const row: Table.Row = {className: "row", cols};

    const rows: Table.Row[] = [];
    for (let i = 0; i < limit; i++) {
        rows.push(row);
    }

    return {rows};
}
