# Quick Testing Guide

## Start Testing

1. **Start the development server:**
   ```bash
   cd web
   npm run dev
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:3000/search`
   - Open browser DevTools (F12) to check for console errors

## Quick Smoke Tests (5 minutes)

### ✅ Basic Functionality
1. **Search works:**
   - Type in keyword search → Results update
   - Apply a filter → Results update
   - Clear filters → All filters removed

2. **Mobile view:**
   - Resize browser to mobile width (< 1024px)
   - Click "Filters" button → Drawer opens
   - Close drawer → Works

3. **Keyboard shortcuts:**
   - Press `/` → Search input focuses
   - Press `?` → Shortcuts modal opens
   - Press `Esc` → Modal closes

4. **Schedule:**
   - Add a section → Toast appears
   - Remove a section → Toast appears
   - Export schedule → File downloads

5. **Pagination:**
   - If results > 20, pagination appears
   - Click page 2 → Navigates correctly

## Full Testing

See `TESTING_CHECKLIST.md` for comprehensive testing guide covering:
- Mobile responsiveness
- Keyboard shortcuts
- Toast notifications
- Active filter chips
- Schedule conflict detection
- Pagination
- Skeleton loaders
- Accessibility
- Performance
- Cross-browser compatibility

## Common Issues to Watch For

1. **Console Errors:**
   - Check browser console for any red errors
   - Should be clean on initial load

2. **Layout Issues:**
   - No horizontal scrolling on mobile
   - Elements don't overlap
   - Text is readable

3. **Interaction Issues:**
   - Buttons respond to clicks
   - Modals open/close correctly
   - Focus is visible on keyboard navigation

4. **Performance:**
   - Page loads quickly
   - No lag when typing in search
   - Smooth transitions

## Reporting Issues

If you find issues:
1. Note the browser and version
2. Note the device/screen size
3. Note the steps to reproduce
4. Check console for errors
5. Take screenshots if visual issues

