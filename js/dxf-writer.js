// Minimal AutoCAD R12 (AC1009) ASCII DXF writer.
// Uses only LINE and TEXT entities for maximum compatibility with any DXF reader.

class DxfWriter {
  constructor() {
    this.layers = new Map(); // name -> color (AutoCAD Color Index)
    this.entities = [];
  }

  addLayer(name, colorIndex = 7) {
    if (!this.layers.has(name)) this.layers.set(name, colorIndex);
  }

  addLine(layer, x1, y1, x2, y2) {
    this.addLayer(layer);
    this.entities.push(
      ['0', 'LINE'],
      ['8', layer],
      ['10', fmt(x1)],
      ['20', fmt(y1)],
      ['30', '0.0'],
      ['11', fmt(x2)],
      ['21', fmt(y2)],
      ['31', '0.0']
    );
  }

  addRectLines(layer, x0, y0, x1, y1) {
    this.addLine(layer, x0, y0, x1, y0);
    this.addLine(layer, x1, y0, x1, y1);
    this.addLine(layer, x1, y1, x0, y1);
    this.addLine(layer, x0, y1, x0, y0);
  }

  addText(layer, x, y, height, text) {
    this.addLayer(layer);
    this.entities.push(
      ['0', 'TEXT'],
      ['8', layer],
      ['10', fmt(x)],
      ['20', fmt(y)],
      ['30', '0.0'],
      ['40', fmt(height)],
      ['1', String(text)]
    );
  }

  toString() {
    const lines = [];
    const push = (pairs) => pairs.forEach(([code, val]) => lines.push(code, val));

    push([['0', 'SECTION'], ['2', 'HEADER'], ['9', '$ACADVER'], ['1', 'AC1009'], ['9', '$INSUNITS'], ['70', '4'], ['0', 'ENDSEC']]);

    push([['0', 'SECTION'], ['2', 'TABLES'], ['0', 'TABLE'], ['2', 'LAYER'], ['70', String(this.layers.size)]]);
    for (const [name, color] of this.layers) {
      push([['0', 'LAYER'], ['2', name], ['70', '0'], ['62', String(color)], ['6', 'CONTINUOUS']]);
    }
    push([['0', 'ENDTAB'], ['0', 'ENDSEC']]);

    lines.push('0', 'SECTION', '2', 'ENTITIES');
    for (const pair of this.entities) lines.push(pair[0], pair[1]);
    lines.push('0', 'ENDSEC');

    lines.push('0', 'EOF');
    return lines.join('\n') + '\n';
  }
}

function fmt(n) {
  return Math.round(n * 1000) / 1000;
}

if (typeof module !== 'undefined') module.exports = { DxfWriter };
