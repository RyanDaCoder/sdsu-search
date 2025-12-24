# Performance Validation Guide

This guide helps validate the performance optimizations implemented in the SDSU Course Search application.

## Performance Optimizations Implemented

1. **Lazy Loading**: `SchedulePanel` is lazy loaded to reduce initial bundle size
2. **React.memo**: `CourseCard` and `ResultsList` are memoized to prevent unnecessary re-renders
3. **Debounced Search**: Keyword search is debounced (250ms) to reduce API calls
4. **Code Splitting**: Suspense boundaries for better loading states

---

## 1. Bundle Size Analysis

### Using Next.js Build Analysis

1. **Build the application:**
   ```bash
   cd web
   npm run build
   ```

2. **Check build output:**
   - Next.js will show bundle sizes in the terminal
   - Look for separate chunks for `SchedulePanel`
   - Initial bundle should be smaller since `SchedulePanel` is code-split

3. **Expected Results:**
   - ✅ `SchedulePanel` should be in a separate chunk (not in main bundle)
   - ✅ Initial JavaScript bundle should be smaller
   - ✅ Schedule panel chunk loads on-demand

### Using Browser DevTools

1. **Open Chrome DevTools:**
   - Press `F12` or `Ctrl+Shift+I`
   - Go to **Network** tab
   - Check "Disable cache"
   - Set throttling to "Fast 3G" for realistic testing

2. **Load the page:**
   - Navigate to `http://localhost:3000/search`
   - Reload the page (`Ctrl+R` or `F5`)

3. **Check Network Tab:**
   - Filter by "JS" to see JavaScript files
   - Look for:
     - Main bundle (usually `_app-*.js` or similar)
     - Separate chunk for SchedulePanel (e.g., `SchedulePanel-*.js`)
   - Verify SchedulePanel chunk is NOT loaded initially
   - Verify SchedulePanel chunk loads when needed

4. **Expected Results:**
   - ✅ Initial page load downloads main bundle only
   - ✅ SchedulePanel chunk loads separately (lazy loaded)
   - ✅ Smaller initial bundle size

---

## 2. Lazy Loading Verification

### Test 1: Initial Load

1. **Open DevTools Network tab**
2. **Reload page** (`Ctrl+R`)
3. **Check loaded files:**
   - SchedulePanel chunk should NOT be in initial load
   - Only main bundle and necessary chunks should load

### Test 2: Lazy Load Trigger

1. **Open DevTools Network tab**
2. **Reload page**
3. **Wait for page to fully load**
4. **Check Network tab:**
   - SchedulePanel chunk should load automatically (Next.js preloads)
   - OR it loads when you interact with schedule panel

### Test 3: Suspense Fallback

1. **Throttle network** (DevTools → Network → Throttling → "Slow 3G")
2. **Reload page**
3. **Observe:**
   - Skeleton loader should appear for SchedulePanel
   - No layout shift when panel loads
   - Smooth transition from skeleton to content

---

## 3. React.memo Verification

### Using React DevTools Profiler

1. **Install React DevTools:**
   - Chrome: [React Developer Tools Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - Firefox: [React Developer Tools Extension](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

2. **Open React DevTools:**
   - Click React DevTools icon in browser
   - Go to **Profiler** tab

3. **Start Profiling:**
   - Click the record button (circle)
   - Perform actions:
     - Type in search input
     - Change filters
     - Navigate pages
   - Stop recording

4. **Analyze Results:**
   - Look for `CourseCard` components
   - Check if they re-render unnecessarily
   - **Expected:** CourseCard should only re-render when:
     - Course data actually changes
     - Parent forces re-render with new props
   - **Not expected:** Re-renders when unrelated state changes

5. **Check ResultsList:**
   - Should only re-render when:
     - `isLoading` state changes
     - `results` array changes (length or IDs)
   - Should NOT re-render when:
     - Filter sidebar state changes
     - Schedule panel updates
     - Toast notifications appear

### Manual Verification

1. **Add console logs** (temporary, for testing):
   ```tsx
   // In CourseCard.tsx
   console.log('CourseCard render:', course.id);
   
   // In ResultsList.tsx
   console.log('ResultsList render');
   ```

2. **Test scenarios:**
   - Type in search → Should see minimal re-renders
   - Change filters → Only affected cards should re-render
   - Add section to schedule → CourseCard should NOT re-render
   - Navigate pages → ResultsList should re-render (new data)

3. **Remove console logs** after testing

---

## 4. Debounced Search Verification

### Test Debounce Timing

1. **Open DevTools Network tab**
2. **Type quickly in keyword search:**
   - Type "computer" quickly
   - Should see only ONE API request after you stop typing
   - Not one request per keystroke

3. **Expected Behavior:**
   - ✅ API request fires 250ms after last keystroke
   - ✅ No requests while actively typing
   - ✅ Smooth, responsive typing experience

### Verify with Console

1. **Open DevTools Console**
2. **Monitor API calls:**
   ```javascript
   // In browser console
   let requestCount = 0;
   const originalFetch = window.fetch;
   window.fetch = function(...args) {
     if (args[0].includes('/api/search')) {
       requestCount++;
       console.log(`Search API call #${requestCount}:`, args[0]);
     }
     return originalFetch.apply(this, args);
   };
   ```

3. **Type in search field:**
   - Type 10 characters quickly
   - Should see only 1-2 API calls (not 10)

---

## 5. Performance Metrics

### Core Web Vitals

1. **Use Lighthouse:**
   - Open DevTools → **Lighthouse** tab
   - Select "Performance"
   - Click "Generate report"

2. **Key Metrics to Check:**
   - **First Contentful Paint (FCP)**: < 1.8s (Good)
   - **Largest Contentful Paint (LCP)**: < 2.5s (Good)
   - **Time to Interactive (TTI)**: < 3.8s (Good)
   - **Total Blocking Time (TBT)**: < 200ms (Good)
   - **Cumulative Layout Shift (CLS)**: < 0.1 (Good)

3. **Expected Improvements:**
   - ✅ Faster FCP (smaller initial bundle)
   - ✅ Faster TTI (lazy loading reduces initial JS)
   - ✅ Lower TBT (memoization reduces render time)

### Bundle Size Metrics

1. **Check bundle sizes:**
   ```bash
   # After building
   cd web/.next
   # Check static/chunks directory
   ```

2. **Compare:**
   - Main bundle size
   - SchedulePanel chunk size
   - Total initial load size

3. **Targets:**
   - Initial bundle: < 200KB (gzipped)
   - SchedulePanel chunk: < 50KB (gzipped)
   - Total initial load: < 300KB (gzipped)

---

## 6. Real-World Performance Testing

### Test on Slow Network

1. **DevTools → Network → Throttling:**
   - Select "Slow 3G" or "Fast 3G"
   - Reload page
   - Measure time to interactive

2. **Expected:**
   - ✅ Page becomes interactive faster
   - ✅ Skeleton loaders show immediately
   - ✅ No layout shift

### Test on Mobile Device

1. **Use Chrome DevTools Device Emulation:**
   - Press `Ctrl+Shift+M` (toggle device toolbar)
   - Select a mobile device
   - Test performance

2. **Or test on real device:**
   - Connect to same network
   - Access `http://[your-ip]:3000/search`
   - Test performance

3. **Expected:**
   - ✅ Fast initial load
   - ✅ Smooth interactions
   - ✅ No janky scrolling

---

## 7. Memory Leak Detection

### Check for Memory Leaks

1. **Open DevTools → Memory tab**
2. **Take heap snapshot:**
   - Click "Take snapshot"
   - Interact with app (add/remove sections, change filters)
   - Take another snapshot
   - Compare snapshots

3. **Expected:**
   - ✅ No growing memory usage
   - ✅ Components properly unmount
   - ✅ Event listeners cleaned up

### Check Event Listeners

1. **DevTools → Elements → Event Listeners**
2. **Check for:**
   - Proper cleanup of keyboard event listeners
   - No duplicate listeners
   - Listeners removed when components unmount

---

## 8. Performance Checklist

### Lazy Loading
- [ ] SchedulePanel is in separate chunk
- [ ] Initial bundle doesn't include SchedulePanel
- [ ] SchedulePanel loads on-demand
- [ ] Suspense fallback shows correctly
- [ ] No layout shift when panel loads

### React.memo
- [ ] CourseCard doesn't re-render unnecessarily
- [ ] ResultsList doesn't re-render unnecessarily
- [ ] Memoization works correctly
- [ ] Custom comparison functions work

### Debouncing
- [ ] Search input is debounced (250ms)
- [ ] API calls are reduced
- [ ] Typing feels responsive

### Bundle Size
- [ ] Initial bundle < 200KB (gzipped)
- [ ] Code splitting works
- [ ] Chunks load efficiently

### Core Web Vitals
- [ ] FCP < 1.8s
- [ ] LCP < 2.5s
- [ ] TTI < 3.8s
- [ ] TBT < 200ms
- [ ] CLS < 0.1

### User Experience
- [ ] Fast page load
- [ ] Smooth interactions
- [ ] No janky scrolling
- [ ] Responsive on mobile
- [ ] Works on slow networks

---

## 9. Tools and Resources

### Recommended Tools

1. **Chrome DevTools**
   - Network tab for bundle analysis
   - Performance tab for profiling
   - Lighthouse for metrics

2. **React DevTools**
   - Profiler for re-render analysis
   - Components tree inspection

3. **WebPageTest**
   - https://www.webpagetest.org/
   - Real-world performance testing

4. **Bundle Analyzer** (Optional)
   ```bash
   npm install @next/bundle-analyzer
   ```
   - Add to `next.config.js`
   - Analyze bundle composition

### Performance Budget

Set performance budgets:
- Initial bundle: < 200KB
- Total initial load: < 300KB
- Time to Interactive: < 3s
- First Contentful Paint: < 1.5s

---

## 10. Troubleshooting

### Issue: Bundle Still Large

**Check:**
- Are all large dependencies necessary?
- Is code splitting working?
- Are there duplicate dependencies?

**Solutions:**
- Use dynamic imports for large components
- Check for duplicate dependencies
- Optimize images and assets

### Issue: Too Many Re-renders

**Check:**
- React DevTools Profiler
- Console logs in components
- Memoization working correctly?

**Solutions:**
- Verify React.memo comparison functions
- Check for unnecessary state updates
- Use useMemo/useCallback where needed

### Issue: Slow Initial Load

**Check:**
- Network throttling
- Bundle sizes
- Server response times

**Solutions:**
- Enable compression
- Optimize API responses
- Use CDN for static assets

---

## Notes

- Performance metrics vary by device and network
- Test on multiple devices and networks
- Monitor performance over time
- Set up performance monitoring in production

