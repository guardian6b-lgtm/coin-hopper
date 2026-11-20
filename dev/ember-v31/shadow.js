// Shared with installEmberV31 in the composed development page.
let emberV31GroundShadowReady = () => false;
let emberV31ShadowOffset = () => 0;

function drawEmberGroundShadow(player, anchors) {
  const center = player.x + player.w / 2 + emberV31ShadowOffset(player, anchors);
  const feet = player.y + player.h;
  const contactRadius = player.w * 0.52;
  const firstColumn = Math.max(0, Math.floor((center - contactRadius) / T));
  const lastColumn = Math.min(LW - 1, Math.floor((center + contactRadius) / T));
  const firstRow = Math.max(0, Math.ceil(feet / T));

  function surfaceBelow(column) {
    for (let row = firstRow; row < ROWS; row++) {
      if (isSolid(column, row) && !isSolid(column, row - 1)) return row * T;
    }
    return null;
  }

  // Split a footprint at lips or holes. Adjacent tiles at the same elevation
  // receive a single ellipse so an ordinary tile seam leaves no paint seam.
  let column = firstColumn;
  while (column <= lastColumn) {
    const start = column;
    const surface = surfaceBelow(column++);
    while (column <= lastColumn && surfaceBelow(column) === surface) column++;
    if (surface === null) continue;
    const strength = 1 / (1 + (surface - feet) / (T * 2));
    const radiusX = contactRadius * (0.45 + 0.55 * strength);
    const radiusY = 1 + 2 * strength;
    if (center + radiusX <= start * T || center - radiusX >= column * T) continue;
    cx.save();
    cx.beginPath();
    cx.rect(start * T - cam, surface, (column - start) * T, 2 * radiusY);
    cx.clip();
    cx.fillStyle = '#283655';
    cx.globalAlpha = 0.16 * strength;
    cx.beginPath();
    cx.ellipse(center - cam, surface + radiusY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    cx.fill();
    cx.restore();
  }
}
