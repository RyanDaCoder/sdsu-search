# Testing Checklist - SDSU Course Search UI

## Pre-Testing Setup

1. **Start Development Server**
   ```bash
   cd web
   npm run dev
   ```
   - [ ] Server starts without errors
   - [ ] No console errors on initial load
   - [ ] Page loads at `http://localhost:3000/search`

2. **Verify Database Connection**
   - [ ] Search results load (even if empty)
   - [ ] No database connection errors in console

---

## 1. Mobile Responsiveness Testing

### Filter Sidebar (Mobile)
- [ ] On mobile viewport (< 1024px), filter sidebar is hidden by default
- [ ] "Filters" button appears at top of page on mobile
- [ ] Clicking "Filters" button opens drawer from left side
- [ ] Drawer has backdrop overlay (darkened background)
- [ ] Drawer can be closed by:
  - [ ] Clicking the X button in header
  - [ ] Clicking the backdrop overlay
  - [ ] Pressing `Esc` key
- [ ] Drawer is scrollable if content is long
- [ ] All filter inputs are touch-friendly (minimum 44px height)

### Layout (Mobile)
- [ ] On mobile, layout stacks vertically:
  - [ ] Filter button at top
  - [ ] Search results in middle
  - [ ] Schedule panel at bottom
- [ ] No horizontal scrolling on main content
- [ ] Weekly grid is horizontally scrollable on mobile
- [ ] All buttons meet minimum touch target size (44x44px)

### Desktop Layout
- [ ] On desktop (≥ 1024px), three-column layout:
  - [ ] Filters sidebar (320px) on left
  - [ ] Search results in center
  - [ ] Schedule panel (420px) on right
- [ ] Schedule panel is sticky on scroll

---

## 2. Keyboard Shortcuts Testing

### Focus Search (`/`)
- [ ] Press `/` when not typing in an input
- [ ] Keyword search input receives focus
- [ ] Does NOT trigger when typing in any input/textarea
- [ ] Does NOT trigger when modifier keys (Ctrl/Cmd/Alt) are pressed

### Show Shortcuts (`?`)
- [ ] Press `?` opens keyboard shortcuts modal
- [ ] Modal displays all shortcuts correctly
- [ ] Modal can be closed with:
  - [ ] Close button
  - [ ] `Esc` key
  - [ ] Clicking backdrop
- [ ] Focus is trapped inside modal (Tab cycles through buttons)
- [ ] Focus returns to previous element when modal closes

### Close Modals/Drawers (`Esc`)
- [ ] `Esc` closes mobile filter drawer
- [ ] `Esc` closes keyboard shortcuts modal
- [ ] `Esc` closes course details modal
- [ ] `Esc` does NOT close when no modals are open

---

## 3. Toast Notifications Testing

### Add Section to Schedule
- [ ] Click "Add to Schedule" on a section
- [ ] Success toast appears: "CS 210 section 01 added to schedule"
- [ ] Toast appears in bottom-right corner
- [ ] Toast has green background and checkmark icon
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Toast can be manually dismissed with X button

### Remove Section from Schedule
- [ ] Click "Remove" on a schedule item
- [ ] Info toast appears: "CS 210 removed from schedule"
- [ ] Toast has blue background and info icon

### Clear Schedule
- [ ] Click "Clear" button in schedule panel
- [ ] Info toast appears: "Schedule cleared"
- [ ] Multiple toasts stack vertically

### Export Schedule
- [ ] Export as Text → Success toast: "Schedule exported as text file"
- [ ] Export as JSON → Success toast: "Schedule exported as JSON file"
- [ ] Export as iCal → Success toast: "Schedule exported as iCal file"
- [ ] File downloads correctly

### Filter Changes
- [ ] Click "Clear all filters"
- [ ] Info toast appears: "All filters cleared"
- [ ] Only shows if filters were actually active

### Error Toasts
- [ ] Try to add conflicting section
- [ ] Error toast appears with red background and X icon
- [ ] Error toast displays error message

### Toast Behavior
- [ ] Multiple toasts stack correctly
- [ ] Toasts don't overlap
- [ ] Toasts are accessible (ARIA labels)
- [ ] Toast animations work (slide in from right)

---

## 4. Active Filter Chips Testing

### Display
- [ ] Active filters appear as removable chips above search results
- [ ] Chips show correct labels:
  - [ ] Keyword: "Keyword: 'search term'"
  - [ ] Subject: "Subject: CS"
  - [ ] Course: "Course: 210"
  - [ ] Days: "Days: MWF" (one chip per day)
  - [ ] Time: "After: 9:00 AM" and "Before: 5:00 PM"
  - [ ] Modality: "Modality: In-person"
  - [ ] Instructor: "Instructor: Smith"
  - [ ] GE: "GE: GE-IIB" (one chip per GE code)
- [ ] Default term (20251) does NOT show as chip

### Removal
- [ ] Click X on any filter chip removes that filter
- [ ] URL updates immediately
- [ ] Search results update
- [ ] Chip disappears from display
- [ ] Removing last filter in a group removes the group header

### Styling
- [ ] Chips have SDSU red theme
- [ ] Hover state changes chip to solid red background
- [ ] Chips are touch-friendly on mobile

---

## 5. Schedule Conflict Detection Testing

### Visual Indicators
- [ ] Conflicting sections appear in red in weekly grid
- [ ] Conflicting sections have red background (#FEE2E2)
- [ ] Conflicting sections have red border (#FCA5A5)
- [ ] Conflicting sections have red text (#991B1B)
- [ ] Tooltip shows "(CONFLICT)" in title

### Conflict Detection Logic
- [ ] Add two sections with overlapping times
- [ ] Both sections show as conflicting
- [ ] Remove one conflicting section
- [ ] Remaining section no longer shows conflict
- [ ] Conflicts update in real-time

### Error Handling
- [ ] Try to add conflicting section
- [ ] Error message appears: "That section conflicts with something already in your schedule."
- [ ] Section is NOT added to schedule
- [ ] Error toast appears

---

## 6. Pagination Testing

### Navigation
- [ ] Pagination controls appear when results > 20
- [ ] "Previous" button disabled on page 1
- [ ] "Next" button disabled on last page
- [ ] Click page numbers navigates to that page
- [ ] URL updates with `?page=2` parameter
- [ ] Browser back/forward buttons work correctly
- [ ] Page number persists when refreshing

### Display
- [ ] Shows "Showing X of Y results"
- [ ] Shows "Page X of Y" below pagination
- [ ] Ellipsis appears for large page counts
- [ ] Current page is highlighted in red

### Edge Cases
- [ ] Changing filters resets to page 1
- [ ] Pagination works with all filter combinations
- [ ] Skeleton loaders show during pagination loading

---

## 7. Skeleton Loaders Testing

### Initial Load
- [ ] On first page load, skeleton loaders appear
- [ ] 5 skeleton cards show while loading
- [ ] Skeletons match course card layout
- [ ] Skeletons have pulse animation

### Pagination Loading
- [ ] When navigating pages, 2 skeleton cards appear at bottom
- [ ] Existing results remain visible
- [ ] Skeletons appear below existing results

### Schedule Panel Loading
- [ ] Schedule panel shows skeleton on initial load
- [ ] Skeleton matches panel layout
- [ ] Skeleton disappears when panel loads

---

## 8. Accessibility Testing

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible (red outline)
- [ ] Skip to main content link works (Tab on page load)

### Screen Reader
- [ ] All buttons have `aria-label` attributes
- [ ] Modals have `aria-modal="true"` and `aria-labelledby`
- [ ] Toast notifications have `role="alert"`
- [ ] Filter drawer has `role="dialog"` and `aria-labelledby`
- [ ] Skip link is accessible to screen readers

### Focus Management
- [ ] Focus trapped in modals (Tab cycles within modal)
- [ ] Focus returns to trigger element when modal closes
- [ ] Focus visible on all interactive elements

### ARIA Labels
- [ ] Filter inputs have appropriate labels
- [ ] Buttons have descriptive labels
- [ ] Icons have `aria-hidden="true"` where appropriate
- [ ] Form fields are properly labeled

---

## 9. Performance Testing

### Lazy Loading
- [ ] Schedule panel loads lazily (check Network tab)
- [ ] Initial bundle size is smaller
- [ ] Schedule panel appears after main content loads

### Memoization
- [ ] CourseCard doesn't re-render unnecessarily
- [ ] ResultsList doesn't re-render when filters don't change
- [ ] Check React DevTools Profiler for unnecessary renders

### Loading States
- [ ] No layout shift when content loads
- [ ] Smooth transitions between states
- [ ] Debounced search input (250ms delay)

---

## 10. Cross-Browser Testing

### Chrome/Edge
- [ ] All features work correctly
- [ ] Styling is consistent
- [ ] Animations work smoothly

### Firefox
- [ ] All features work correctly
- [ ] Styling is consistent
- [ ] Animations work smoothly

### Safari
- [ ] All features work correctly
- [ ] Styling is consistent
- [ ] Touch interactions work
- [ ] Animations work smoothly

### Mobile Browsers
- [ ] iOS Safari works correctly
- [ ] Chrome Mobile works correctly
- [ ] Touch interactions are responsive

---

## 11. Edge Cases & Error Handling

### Empty States
- [ ] No results shows helpful message
- [ ] Empty schedule shows helpful message
- [ ] No active filters shows no chip section

### Error States
- [ ] Network error shows error message
- [ ] Error toast appears for failed actions
- [ ] Retry button works on error page

### URL Parameters
- [ ] Invalid page number defaults to page 1
- [ ] Invalid filters are ignored gracefully
- [ ] URL parameters persist on refresh
- [ ] Browser back/forward works correctly

### Data Edge Cases
- [ ] Courses with no sections handled gracefully
- [ ] Sections with no meetings handled gracefully
- [ ] Missing course titles show "(Untitled)"
- [ ] TBA meetings display correctly

---

## 12. Visual/UI Polish

### SDSU Branding
- [ ] Colors match SDSU theme (Aztec Red #8B1538)
- [ ] Typography is consistent
- [ ] Spacing and padding are consistent
- [ ] Shadows and borders are subtle

### Responsive Design
- [ ] Layout adapts smoothly between breakpoints
- [ ] No horizontal scrolling on mobile
- [ ] Text is readable at all sizes
- [ ] Images/icons scale appropriately

### Interactions
- [ ] Hover states work on all interactive elements
- [ ] Transitions are smooth (150ms)
- [ ] Focus states are clearly visible
- [ ] Active states provide feedback

---

## Testing Notes

**Date:** _______________
**Tester:** _______________
**Browser:** _______________
**Device:** _______________

**Issues Found:**
1. 
2. 
3. 

**Notes:**
- 

