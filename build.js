const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build paths
const srcDir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Empty the dist directory
console.log('Cleaning dist directory...');
fs.readdirSync(distDir).forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.lstatSync(filePath).isDirectory()) {
    fs.rmdirSync(filePath, { recursive: true });
  } else {
    fs.unlinkSync(filePath);
  }
});

// Run webpack build
console.log('Building with webpack...');
try {
  execSync('npx webpack --mode production', { stdio: 'inherit' });
} catch (error) {
  console.error('Webpack build failed:', error);
  process.exit(1);
}

// Copy manifest.json and icons to dist
console.log('Copying static assets...');
fs.copyFileSync(
  path.join(publicDir, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Create icons directory in dist if it doesn't exist
const distIconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir);
}

// Create placeholder icons if they don't exist
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconFile = path.join(publicDir, 'icons', `icon${size}.png`);
  const distIconFile = path.join(distIconsDir, `icon${size}.png`);
  
  // Generate placeholder icon if it doesn't exist
  if (!fs.existsSync(iconFile)) {
    console.log(`Creating placeholder icon of size ${size}x${size}...`);
    try {
      execSync(`convert -size ${size}x${size} xc:blue -fill white -gravity center -pointsize ${size/2} -annotate 0 "RT" ${iconFile}`);
    } catch (error) {
      console.warn(`Could not create icon with ImageMagick. Using empty placeholder for icon${size}.png`);
      // Create an empty file as placeholder
      fs.writeFileSync(iconFile, '');
    }
  }
  
  // Copy icon to dist
  fs.copyFileSync(iconFile, distIconFile);
});

console.log('Build completed successfully!');
console.log('\nTo load the extension in Chrome:');
console.log('1. Go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked" and select the dist folder'); 