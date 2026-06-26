const fs = require('fs');
const path = require('path');

// Simple base64 PNG (a small blue square as placeholder)
const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAAi5T4kAAAAH0lEQVQ4EWNk+M/A8J8BCDAyMjIxMjIyMTIyMjEy/QcA75GBM9OvrU0AAAAASUVORK5CYII=';

const iconPath = path.join(__dirname, '../assets/notification-icon.png');

// Create assets folder if it doesn't exist
const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write the icon file
fs.writeFileSync(iconPath, Buffer.from(iconBase64, 'base64'));
console.log('✅ Created notification-icon.png');