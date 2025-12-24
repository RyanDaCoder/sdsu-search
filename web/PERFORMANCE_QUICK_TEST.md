# Quick Performance Test (5 minutes)

## 1. Verify Lazy Loading (2 minutes)

### In Browser DevTools:

1. **Open Chrome DevTools** (`F12`)
2. **Go to Network tab**
3. **Reload page** (`Ctrl+R` or `F5`)
4. **Filter by "JS"** (JavaScript files)

**What to look for:**
- ✅ SchedulePanel should be in a **separate chunk file**
- ✅ This chunk should **NOT** load on initial page load
- ✅ Main bundle should be smaller

**Expected result:**
- Initial load: Main bundle only
- SchedulePanel loads separately (lazy loaded)

---

## 2. Verify React.memo (2 minutes)

### Using React DevTools:

1. **Install React DevTools** (if not installed)
2. **Open React DevTools** → **Profiler** tab
3. **Click record** (circle button)
4. **Perform actions:**
   - Type in search input
   - Change a filter
   - Add a section to schedule
5. **Stop recording**

**What to look for:**
- ✅ `CourseCard` components should **NOT** re-render when:
  - Typing in search (if course data unchanged)
  - Adding sections to schedule
  - Changing unrelated filters
- ✅ `CourseCard` **SHOULD** re-render when:
  - Course data actually changes
  - New results loaded

**Expected result:**
- Minimal re-renders of CourseCard
- Only re-renders when necessary

---

## 3. Verify Debouncing (1 minute)

### In Browser DevTools:

1. **Open Network tab**
2. **Type quickly in keyword search** (e.g., type "computer" fast)
3. **Watch Network requests**

**What to look for:**
- ✅ Only **ONE** API request after you stop typing
- ✅ Request fires ~250ms after last keystroke
- ✅ NOT one request per keystroke

**Expected result:**
- Typing 10 characters = 1 API request (not 10)

---

## Quick Checklist

- [ ] SchedulePanel is lazy loaded (separate chunk)
- [ ] CourseCard doesn't re-render unnecessarily
- [ ] Search input is debounced (250ms)
- [ ] Initial bundle is reasonable size
- [ ] Page loads quickly
- [ ] No console errors

---

## If Something's Wrong

### Bundle too large?
- Check if SchedulePanel is actually lazy loaded
- Verify code splitting is working
- Check for large dependencies

### Too many re-renders?
- Verify React.memo is working
- Check comparison functions
- Use React DevTools Profiler

### Search not debounced?
- Check `useDebouncedValue` hook
- Verify debounce delay (250ms)
- Check Network tab for request frequency

---

## Full Testing

For comprehensive performance testing, see `PERFORMANCE_VALIDATION.md`

