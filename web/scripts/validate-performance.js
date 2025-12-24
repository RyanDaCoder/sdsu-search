#!/usr/bin/env node

/**
 * Performance Validation Script
 * 
 * This script helps validate performance optimizations by checking:
 * 1. Bundle sizes
 * 2. Code splitting
 * 3. Lazy loading implementation
 * 
 * Usage:
 *   node scripts/validate-performance.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Performance Validation\n');

// Check if build exists
const buildDir = path.join(__dirname, '..', '.next');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build directory not found. Please run "npm run build" first.\n');
  process.exit(1);
}

console.log('✅ Build directory found\n');

// Check for lazy loaded chunks
const chunksDir = path.join(buildDir, 'static', 'chunks');
if (fs.existsSync(chunksDir)) {
  const files = fs.readdirSync(chunksDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  
  console.log(`📦 Found ${jsFiles.length} JavaScript chunks\n`);
  
  // Look for SchedulePanel chunk
  const schedulePanelChunk = jsFiles.find(f => 
    f.includes('SchedulePanel') || 
    f.includes('schedule') ||
    f.includes('Schedule')
  );
  
  if (schedulePanelChunk) {
    const filePath = path.join(chunksDir, schedulePanelChunk);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ SchedulePanel is code-split:`);
    console.log(`   Chunk: ${schedulePanelChunk}`);
    console.log(`   Size: ${sizeKB} KB\n`);
  } else {
    console.log('⚠️  SchedulePanel chunk not found (may be inlined or named differently)\n');
  }
  
  // Calculate total initial bundle size
  const mainChunks = jsFiles.filter(f => 
    f.includes('main') || 
    f.includes('app') ||
    f.includes('webpack')
  );
  
  let totalSize = 0;
  mainChunks.forEach(chunk => {
    const filePath = path.join(chunksDir, chunk);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  });
  
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log(`📊 Initial Bundle Analysis:`);
  console.log(`   Main chunks: ${mainChunks.length}`);
  console.log(`   Total size: ${totalSizeKB} KB (${totalSizeMB} MB)`);
  
  if (totalSize < 200 * 1024) {
    console.log(`   ✅ Under 200KB target\n`);
  } else if (totalSize < 300 * 1024) {
    console.log(`   ⚠️  Over 200KB but under 300KB\n`);
  } else {
    console.log(`   ❌ Over 300KB - consider optimization\n`);
  }
}

// Check source files for optimizations
console.log('🔍 Checking source code optimizations:\n');

const sourceFiles = [
  {
    path: path.join(__dirname, '..', 'app', 'search', 'SearchClient.tsx'),
    checks: [
      { pattern: /React\.lazy|import\(/, name: 'Lazy loading' },
      { pattern: /Suspense/, name: 'Suspense boundary' },
    ]
  },
  {
    path: path.join(__dirname, '..', 'components', 'search', 'CourseCard.tsx'),
    checks: [
      { pattern: /memo\(/, name: 'React.memo' },
    ]
  },
  {
    path: path.join(__dirname, '..', 'components', 'search', 'ResultsList.tsx'),
    checks: [
      { pattern: /memo\(/, name: 'React.memo' },
    ]
  }
];

sourceFiles.forEach(({ path: filePath, checks }) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    console.log(`📄 ${fileName}:`);
    checks.forEach(({ pattern, name }) => {
      if (pattern.test(content)) {
        console.log(`   ✅ ${name} implemented`);
      } else {
        console.log(`   ❌ ${name} NOT found`);
      }
    });
    console.log('');
  }
});

console.log('✨ Validation complete!\n');
console.log('💡 Next steps:');
console.log('   1. Run "npm run dev" and test in browser');
console.log('   2. Use Chrome DevTools Network tab to verify lazy loading');
console.log('   3. Use React DevTools Profiler to check memoization');
console.log('   4. Run Lighthouse for Core Web Vitals\n');

