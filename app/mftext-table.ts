// This source code is largely based on `markdeep.js`

const TABLE_ROW       = /(?:\n[ \t]*(?:(?:\|?[ \t\S]+?(?:\|[ \t\S]+?)+\|?)|\|[ \t\S]+\|)(?=\n))/.source;
const TABLE_SEPARATOR = /\n[ \t]*(?:(?:\|? *\:?-+\:?(?: *\| *\:?-+\:?)+ *\|?|)|\|[\:-]+\|)(?=\n)/.source;
const TABLE_CAPTION   = /\n[ \t]*\[[^\n\|]+\][ \t]*(?=\n)/.source;
const TABLE_REGEXP    = new RegExp(TABLE_ROW + TABLE_SEPARATOR + TABLE_ROW + '+(' + TABLE_CAPTION + ')?', 'g');

/** Maruku ("github")-style table processing */
export function replaceTables(s: string): string {

    function trimTableRowEnds(row: string): string {
        return row.trim().replace(/^\||\|$/g, '');
    }

    s = s.replace(TABLE_REGEXP, match => {
        // Found a table, actually parse it by rows
        const rowArray = match.split('\n');

        let result = '';

        // Skip the bogus leading row
        const startRow = (rowArray[0] === '') ? 1 : 0;

        let caption: string | null = rowArray[rowArray.length - 1].trim();

        if ((caption.length > 3) && (caption[0] === '[') && (caption[caption.length - 1] === ']')) {
            // Remove the caption from the row array
            rowArray.pop();
            caption = caption.substring(1, caption.length - 1);
        } else {
            caption = null;
        }

        // Parse the separator row for left/center/right-indicating colons
        const columnStyle: string[] = [];
        trimTableRowEnds(rowArray[startRow + 1]).replace(/:?-+:?/g, match => {
            const left = (match[0] === ':');
            const right = (match[match.length - 1] === ':');
            columnStyle.push(' style="text-align:' + ((left && right) ? 'center' : (right ? 'right' : 'left')) + '"');
            return '';
        });

        let row = rowArray[startRow + 1].trim();
        const hasLeadingBar  = row[0] === '|';
        const hasTrailingBar = row[row.length - 1] === '|';

        let tag = 'th';

        for (var r = startRow; r < rowArray.length; ++r) {
            // Remove leading and trailing whitespace and column delimiters
            row = rowArray[r].trim();

            if (! hasLeadingBar && (row[0] === '|')) {
                // Empty first column
                row = '&nbsp;' + row;
            }

            if (! hasTrailingBar && (row[row.length - 1] === '|')) {
                // Empty last column
                row += '&nbsp;';
            }

            row = trimTableRowEnds(row);
            let i = 0;
            result += `<tr><${tag}${columnStyle[0]}>`;
            result += row.replace(/ *\| */g, () => {
                ++i;
                return ` </${tag}><${tag}${columnStyle[i] || ''}> `;
            });
            result += `</${tag}></tr>\n`;

            // Skip the header-separator row
            if (r == startRow) {
                ++r;
                tag = 'td';
            }
        }

        result = `<table class="table">${result}</table>`;

        if (caption) {
            caption = `<div class="tablecaption">${caption}</div>`;
            result = caption + result;
        }

        return result;
    });

    return s;
}
