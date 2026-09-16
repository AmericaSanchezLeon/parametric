// Parametric masonry wall elevation generator.
// Produces a list of unit rectangles (brick/block coursing) plus wall
// outline and opening outlines, all in millimetres, origin at wall
// bottom-left corner.

function rectsOverlap(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function generateWallGeometry(params) {
  const {
    wallWidth,
    wallHeight,
    unitLength,
    unitHeight,
    joint,
    bond, // 'running' | 'stack'
    openings, // [{x, y, width, height}]
  } = params;

  const nCourses = Math.max(1, Math.round(wallHeight / (unitHeight + joint)));
  const courseHeight = wallHeight / nCourses;
  const actualUnitHeight = courseHeight - joint;

  const nUnitsPerCourse = Math.max(1, Math.round(wallWidth / (unitLength + joint)));
  const pitch = wallWidth / nUnitsPerCourse;
  const actualUnitLength = pitch - joint;
  const halfPitch = pitch / 2;

  const openingRects = openings.map((o) => ({
    x0: o.x,
    y0: o.y,
    x1: o.x + o.width,
    y1: o.y + o.height,
  }));

  const units = [];

  for (let row = 0; row < nCourses; row++) {
    const y0 = row * courseHeight + joint / 2;
    const y1 = y0 + actualUnitHeight;
    const offset = bond === 'running' && row % 2 === 1 ? halfPitch : 0;

    for (let x = -offset; x < wallWidth; x += pitch) {
      const ux0 = x + joint / 2;
      const ux1 = ux0 + actualUnitLength;
      const cx0 = Math.max(ux0, 0);
      const cx1 = Math.min(ux1, wallWidth);
      if (cx1 - cx0 <= 1e-6) continue;

      const rect = { x0: cx0, y0, x1: cx1, y1 };
      const blocked = openingRects.some((o) => rectsOverlap(rect, o));
      if (blocked) continue;

      units.push(rect);
    }
  }

  return {
    units,
    wall: { x0: 0, y0: 0, x1: wallWidth, y1: wallHeight },
    openings: openingRects,
    stats: {
      nCourses,
      courseHeight,
      actualUnitHeight,
      nUnitsPerCourse,
      pitch,
      actualUnitLength,
      unitCount: units.length,
    },
  };
}

if (typeof module !== 'undefined') module.exports = { generateWallGeometry, rectsOverlap };
