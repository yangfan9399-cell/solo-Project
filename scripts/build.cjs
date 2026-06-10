const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

const distDir = 'dist'

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

console.log('Copying index.html...')
fs.copyFileSync('index.html', path.join(distDir, 'index.html'))

const tailwindCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-background: #ffffff;
  --color-foreground: #1a1a1a;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  --color-border: #e2e8f0;
  --color-muted: #f1f5f9;
  --color-card: #ffffff;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--color-background);
  color: var(--color-foreground);
}
`

console.log('Writing CSS...')
fs.writeFileSync(path.join(distDir, 'index.css'), tailwindCss)

console.log('Building JavaScript...')
esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2020'],
  outfile: path.join(distDir, 'main.js'),
  loader: {
    '.ts': 'tsx',
    '.tsx': 'tsx',
  },
  plugins: [],
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
}).then(() => {
  console.log('Build completed successfully!')
}).catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
