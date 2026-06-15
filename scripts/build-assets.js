import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import chokidar from 'chokidar';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const isWatch = process.argv.includes('--watch');

const buildDir = path.join(projectRoot, 'public', 'build');
const cssInput = path.join(projectRoot, 'resources', 'css', 'app.css');
const cssOutput = path.join(buildDir, 'app.css');
const jsInput = path.join(projectRoot, 'node_modules', 'chart.js', 'dist', 'chart.umd.min.js');
const jsOutput = path.join(buildDir, 'chart.umd.min.js');
const manifestPath = path.join(buildDir, 'manifest.json');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function buildCss() {
    console.log('Building CSS...');
    try {
        const cssContent = fs.readFileSync(cssInput, 'utf8');
        const result = await postcss([tailwindcss, autoprefixer])
            .process(cssContent, {
                from: cssInput,
                to: cssOutput,
            });
        
        ensureDir(buildDir);
        fs.writeFileSync(cssOutput, result.css);
        console.log(`CSS built: ${cssOutput}`);
        return true;
    } catch (error) {
        console.error('CSS build error:', error.message);
        return false;
    }
}

function copyJs() {
    console.log('Copying Chart.js...');
    try {
        ensureDir(buildDir);
        fs.copyFileSync(jsInput, jsOutput);
        console.log(`Chart.js copied: ${jsOutput}`);
        return true;
    } catch (error) {
        console.error('Chart.js copy error:', error.message);
        return false;
    }
}

function generateManifest() {
    const manifest = {
        '/resources/css/app.css': '/build/app.css',
        '/resources/js/app.js': '/build/chart.umd.min.js',
        '/build/app.css': '/build/app.css',
        '/build/chart.umd.min.js': '/build/chart.umd.min.js',
    };
    
    ensureDir(buildDir);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest generated: ${manifestPath}`);
}

async function buildAll() {
    console.log('\n=== Building assets ===\n');
    
    const cssOk = await buildCss();
    const jsOk = copyJs();
    
    if (cssOk && jsOk) {
        generateManifest();
        console.log('\n=== Build complete ===\n');
    } else {
        console.log('\n=== Build failed ===\n');
    }
    
    return cssOk && jsOk;
}

if (isWatch) {
    console.log('Watching for changes...');
    await buildAll();
    
    const watcher = chokidar.watch([
        path.join(projectRoot, 'resources', 'css', '**', '*.css'),
        path.join(projectRoot, 'resources', 'views', '**', '*.blade.php'),
        path.join(projectRoot, 'tailwind.config.js'),
    ]);
    
    watcher.on('change', async (file) => {
        console.log(`File changed: ${file}`);
        await buildCss();
        generateManifest();
    });
    
    console.log('Watcher ready. Press Ctrl+C to exit.');
} else {
    const success = await buildAll();
    process.exit(success ? 0 : 1);
}
