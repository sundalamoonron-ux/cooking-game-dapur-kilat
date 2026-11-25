// Dapur Kilat — the customers behind the orders. One clear job: draw one
// customer's face for an order ticket, so the board reads as people
// waiting for food, not just paper. The face varies with the order id:
// skin, hair and a hat (chef hat, cap, bandana, or none).
const SKINS = ['#f2c79b', '#e8b07e', '#c98a5a', '#8a5a34', '#f7d7b0'];
const HAIRS = ['#2b2118', '#6b3a1e', '#8a8a8a', '#d9a13b', '#4a2b18'];
const HATS = ['chef', 'cap', 'bandana', null];

/** Draw one customer's face, centred at (x, y), at the given radius. */
export function drawCustomerFace(ctx, orderId, x, y, r) {
  const skin = SKINS[orderId % SKINS.length];
  const hair = HAIRS[(orderId * 2 + 1) % HAIRS.length];
  const hat = HATS[orderId % HATS.length];

  // Face.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Hair: a cap of hair over the top of the head.
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.2, r * 0.95, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Eyes.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(x - r * 0.36, y - r * 0.02, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.36, y - r * 0.02, r * 0.11, 0, Math.PI * 2);
  ctx.fill();

  // Smile.
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = Math.max(1.5, r * 0.09);
  ctx.beginPath();
  ctx.arc(x, y + r * 0.22, r * 0.42, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Hat, if this customer wears one.
  if (hat === 'cap') {
    ctx.fillStyle = '#4f8fd9';
    ctx.beginPath();
    ctx.arc(x, y - r * 0.45, r * 0.85, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x - r * 0.85, y - r * 0.55, r * 1.7, r * 0.22);
  } else if (hat === 'chef') {
    ctx.fillStyle = '#fdfdf6';
    ctx.beginPath();
    ctx.arc(x - r * 0.5, y - r * 0.72, r * 0.34, 0, Math.PI * 2);
    ctx.arc(x, y - r * 0.85, r * 0.4, 0, Math.PI * 2);
    ctx.arc(x + r * 0.5, y - r * 0.72, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - r * 0.8, y - r * 0.75, r * 1.6, r * 0.3);
  } else if (hat === 'bandana') {
    ctx.fillStyle = '#d94f3d';
    ctx.fillRect(x - r * 0.9, y - r * 0.75, r * 1.8, r * 0.34);
    ctx.beginPath();
    ctx.moveTo(x + r * 0.9, y - r * 0.58);
    ctx.lineTo(x + r * 1.25, y - r * 0.2);
    ctx.lineTo(x + r * 0.9, y - r * 0.3);
    ctx.closePath();
    ctx.fill();
  }
}
