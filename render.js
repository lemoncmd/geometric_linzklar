const in_path = process.argv[2] ?? "char_glyphs"
const out_file_name = process.argv[3] ?? "main (2).svg"
const fs = require('fs');
const text = fs.readFileSync(`${in_path}/content.txt`, 'utf-8');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const glyph_map = new Map();
const files = fs.readdirSync(`${in_path}/`);
files.forEach(function (file, _index) {
    if (file.slice(-4) !== ".svg") return;
    const svg_glyph = fs.readFileSync(`${in_path}/${file}`, 'utf-8');
    const dom = new JSDOM(svg_glyph);
    const glyph_ = dom.window.document.getElementById("glyph").innerHTML;

    /* DIRTY HACK */
    const glyph = glyph_.replace(/><\/path>/g, " />")
    glyph_map.set(file.slice(0, -4), glyph);
})

const s = JSON.parse(fs.readFileSync(`renderer_settings.json`, 'utf-8'));

const text_rows = text.split("\n");
const column_num = Math.ceil(text_rows.length / [...s.column_format].filter(c => c == "*").length);

const single_column = `        <${"path"} fill="#a00" d="m-10 ${s.viewBox_min_y}h156v1940h-156z" />\n` +
    s.border_colors.map((color, ind) => `        <${"path"} fill="${color}" d="m0 ${s.viewBox_min_y + 10 + 120 * ind}h136v120h-136" />`).join("\n") + "\n\n" +
    [...s.column_format].map((_v, ind) => `        <${"path"} fill="${s.cell_color}" d="m10 ${s.viewBox_min_y + 20 + 120 * ind}h116v100h-116" />`).join("\n");


const columns = Array.from(
    { length: column_num },
    (_, index) => `    <g id="column${column_num - 1 - index}" stroke-width="0" transform="translate(${s.viewBox_min_x + 10 + (156 + s.column_spacing) * index}, 0)">
${single_column}
    </g>`
).join("\n");

const image_full_width = column_num * (156 + s.column_spacing) - s.column_spacing;

fs.writeFileSync(out_file_name,
    `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${image_full_width}px" height="1940px" version="1.1" viewBox="${s.viewBox_min_x} ${s.viewBox_min_y} ${image_full_width} 1940" xmlns="http://www.w3.org/2000/svg">
${columns}

    <g id="glyphs" stroke="#000" stroke-width="10" fill="none">
${text_rows.map((row, ind) => {
        const [initial] = [...row];
        console.log(initial, glyph_map.get(initial));
        return `        <g id="${row}${(1000 + ind).toString(10).slice(1)}" transform="translate(1485, 120)">${glyph_map.get(initial)}</g>`
    }).join("\n")
    }</g>
</svg>`);

