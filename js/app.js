(function () {
  const svgNS = 'http://www.w3.org/2000/svg';

  const el = (id) => document.getElementById(id);
  const wallWidthEl = el('wallWidth');
  const wallHeightEl = el('wallHeight');
  const unitPresetEl = el('unitPreset');
  const jointEl = el('joint');
  const unitLengthEl = el('unitLength');
  const unitHeightEl = el('unitHeight');
  const bondEl = el('bond');
  const openingsBody = el('openingsBody');
  const addOpeningBtn = el('addOpening');
  const downloadBtn = el('downloadDxf');
  const statsEl = el('stats');
  const svg = el('preview');

  const PRESETS = {
    block: { unitLength: 400, unitHeight: 200, joint: 10 },
    brick: { unitLength: 240, unitHeight: 60, joint: 10 },
  };

  let openings = [
    { x: 300, y: 0, width: 900, height: 2100 }, // default door
  ];

  function applyPreset() {
    const preset = PRESETS[unitPresetEl.value];
    if (!preset) return;
    unitLengthEl.value = preset.unitLength;
    unitHeightEl.value = preset.unitHeight;
    jointEl.value = preset.joint;
    render();
  }

  function markCustom() {
    unitPresetEl.value = 'custom';
  }

  function readParams() {
    return {
      wallWidth: Number(wallWidthEl.value) || 0,
      wallHeight: Number(wallHeightEl.value) || 0,
      unitLength: Number(unitLengthEl.value) || 1,
      unitHeight: Number(unitHeightEl.value) || 1,
      joint: Number(jointEl.value) || 0,
      bond: bondEl.value,
      openings: openings.filter((o) => o.width > 0 && o.height > 0),
    };
  }

  function renderOpeningsTable() {
    openingsBody.innerHTML = '';
    openings.forEach((o, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="number" data-field="x" value="${o.x}" step="10"></td>
        <td><input type="number" data-field="y" value="${o.y}" step="10"></td>
        <td><input type="number" data-field="width" value="${o.width}" step="10"></td>
        <td><input type="number" data-field="height" value="${o.height}" step="10"></td>
        <td><button type="button" class="remove-btn" title="Eliminar">&times;</button></td>
      `;
      tr.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', () => {
          openings[i][input.dataset.field] = Number(input.value) || 0;
          render();
        });
      });
      tr.querySelector('.remove-btn').addEventListener('click', () => {
        openings.splice(i, 1);
        renderOpeningsTable();
        render();
      });
      openingsBody.appendChild(tr);
    });
  }

  function svgRect(x0, y0, x1, y1, className) {
    const r = document.createElementNS(svgNS, 'rect');
    r.setAttribute('x', x0);
    r.setAttribute('y', y0);
    r.setAttribute('width', x1 - x0);
    r.setAttribute('height', y1 - y0);
    r.setAttribute('class', className);
    return r;
  }

  function render() {
    const params = readParams();
    if (params.wallWidth <= 0 || params.wallHeight <= 0) return;

    const geo = generateWallGeometry(params);

    // ---- SVG preview (flip Y so wall bottom is at the bottom of the viewport) ----
    const maxPx = 760;
    const scale = maxPx / params.wallWidth;
    const pxW = params.wallWidth * scale;
    const pxH = params.wallHeight * scale;

    svg.setAttribute('width', pxW);
    svg.setAttribute('height', pxH);
    svg.setAttribute('viewBox', `0 0 ${pxW} ${pxH}`);
    svg.innerHTML = `
      <style>
        .wall { fill: none; stroke: #4f8cff; stroke-width: 2; }
        .unit { fill: #23283333; stroke: #6b7280; stroke-width: 1; }
        .opening { fill: #ff8a4f22; stroke: #ff8a4f; stroke-width: 1.5; stroke-dasharray: 4 3; }
      </style>
    `;

    const toPx = (x, y) => [x * scale, pxH - y * scale];

    const g = document.createElementNS(svgNS, 'g');

    geo.units.forEach((u) => {
      const [x0, y1] = toPx(u.x0, u.y1);
      const [x1, y0] = toPx(u.x1, u.y0);
      g.appendChild(svgRect(x0, y1, x1, y0, 'unit'));
    });

    geo.openings.forEach((o) => {
      const [x0, y1] = toPx(o.x0, o.y1);
      const [x1, y0] = toPx(o.x1, o.y0);
      g.appendChild(svgRect(x0, y1, x1, y0, 'opening'));
    });

    const [wx0, wy1] = toPx(geo.wall.x0, geo.wall.y1);
    const [wx1, wy0] = toPx(geo.wall.x1, geo.wall.y0);
    g.appendChild(svgRect(wx0, wy1, wx1, wy0, 'wall'));

    svg.appendChild(g);

    // ---- stats ----
    const s = geo.stats;
    statsEl.innerHTML = `
      Hiladas: ${s.nCourses} · Piezas por hilada: ${s.nUnitsPerCourse}<br>
      Alto real de pieza: ${s.actualUnitHeight.toFixed(1)} mm ·
      Largo real de pieza: ${s.actualUnitLength.toFixed(1)} mm<br>
      Piezas totales dibujadas: ${s.unitCount}
    `;
  }

  function buildDxf() {
    const params = readParams();
    const geo = generateWallGeometry(params);
    const dxf = new DxfWriter();

    dxf.addRectLines('WALL', geo.wall.x0, geo.wall.y0, geo.wall.x1, geo.wall.y1);

    geo.units.forEach((u) => {
      dxf.addRectLines('UNITS', u.x0, u.y0, u.x1, u.y1);
    });

    geo.openings.forEach((o) => {
      dxf.addRectLines('OPENINGS', o.x0, o.y0, o.x1, o.y1);
    });

    dxf.addText(
      'TEXT',
      0,
      geo.wall.y1 + params.unitHeight * 0.6,
      params.unitHeight * 0.35,
      `Muro ${params.wallWidth}x${params.wallHeight} mm - ${params.bond === 'running' ? 'cuatrapeado' : 'a plomo'}`
    );

    return dxf.toString();
  }

  function download() {
    const text = buildDxf();
    const blob = new Blob([text], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muro-parametrico.dxf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  [wallWidthEl, wallHeightEl, jointEl, bondEl].forEach((elm) => elm.addEventListener('input', render));
  [unitLengthEl, unitHeightEl].forEach((elm) => elm.addEventListener('input', () => { markCustom(); render(); }));
  unitPresetEl.addEventListener('change', applyPreset);
  addOpeningBtn.addEventListener('click', () => {
    openings.push({ x: 0, y: 0, width: 800, height: 1000 });
    renderOpeningsTable();
    render();
  });

  renderOpeningsTable();
  render();
})();
