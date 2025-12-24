# Testing Guide: Data Quality & Validation Features

## 1. Test Report Script

### Basic Report
```bash
npm run report:term -- --term 20251
```

**Expected:** Shows totals and any data quality issues. Should show 0 critical issues for seeded data.

### Test with Different Term
```bash
npm run report:term -- --term 20261
```

**Expected:** Error message if term doesn't exist.

---

## 2. Test Validation with Sample Data

### Test Valid Schedule Import (Dry-Run)
```bash
npm run import:schedule -- --file scripts/fixtures/sample_schedule.csv --map lib/import/config/example.schedule.mapping.json --dry-run
```

**Expected:**
- ✅ Parses 5 rows
- ✅ Validation passes (0 errors, some warnings OK)
- ✅ Shows "Would import" summary
- ✅ Creates log file in `import-logs/`

### Test Valid Schedule Import (Actual)
```bash
npm run import:schedule -- --file scripts/fixtures/sample_schedule.csv --map lib/import/config/example.schedule.mapping.json
```

**Expected:**
- ✅ Imports successfully
- ✅ Shows created/updated counts
- ✅ Creates log file
- ✅ Courses appear in search UI

### Test Invalid Schedule Import
```bash
npm run import:schedule -- --file scripts/fixtures/invalid_schedule.csv --map lib/import/config/example.schedule.mapping.json
```

**Expected:**
- ❌ Validation errors detected:
  - Invalid time range (start >= end)
  - Invalid day code (XYZ)
  - Missing sectionKey
  - Invalid time format
- ❌ Import aborts with exit code 1
- ✅ Log file still created with errors

### Test Strict Mode
```bash
npm run import:schedule -- --file scripts/fixtures/sample_schedule.csv --map lib/import/config/example.schedule.mapping.json --strict
```

**Expected:**
- If warnings exist, import aborts
- Shows warnings treated as errors

---

## 3. Test Requirements Import

### Test Valid Requirements Import
```bash
npm run import:requirements -- --file scripts/fixtures/sample_requirements.csv --map lib/import/config/example.requirements.mapping.json --dry-run
```

**Expected:**
- ✅ Parses 7 rows
- ✅ Validation passes
- ✅ Shows unique requirements count
- ✅ Creates log file

### Test Requirements Import (Actual)
```bash
npm run import:requirements -- --file scripts/fixtures/sample_requirements.csv --map lib/import/config/example.requirements.mapping.json
```

**Expected:**
- ✅ Imports successfully
- ✅ Links requirements to courses
- ✅ Creates log file

---

## 4. Test Import Logging

### Check Log Files
```bash
# List all import logs
ls web/import-logs/

# View a log file
cat web/import-logs/<timestamp>-schedule.json
```

**Expected:**
- Log files have timestamp prefix
- JSON format with all import details
- Errors/warnings capped at 50
- Includes CLI flags, file paths, counts

---

## 5. Test Combined Import

### Test Import All (Dry-Run)
```bash
npm run import:all -- --schedule scripts/fixtures/sample_schedule.csv --scheduleMap lib/import/config/example.schedule.mapping.json --req scripts/fixtures/sample_requirements.csv --reqMap lib/import/config/example.requirements.mapping.json --dry-run
```

**Expected:**
- ✅ Runs both imports in sequence
- ✅ Both show validation results
- ✅ No database changes

---

## 6. Test Data Quality After Import

### Import Sample Data
```bash
npm run import:schedule -- --file scripts/fixtures/sample_schedule.csv --map lib/import/config/example.schedule.mapping.json
npm run import:requirements -- --file scripts/fixtures/sample_requirements.csv --map lib/import/config/example.requirements.mapping.json
```

### Run Report
```bash
npm run report:term -- --term 20251
```

**Expected:**
- ✅ Shows imported courses in totals
- ✅ May show warnings for sections with 0 meetings (if any)
- ✅ No critical errors

---

## 7. Test Edge Cases

### Test Empty CSV
```bash
# Create empty.csv (just headers)
echo "TERM,SUBJ,CATALOG_NBR,CLASS_NBR" > empty.csv
npm run import:schedule -- --file empty.csv --map lib/import/config/example.schedule.mapping.json
```

**Expected:**
- ❌ Error: "No valid rows found"
- Exit code 1

### Test Missing Mapping File
```bash
npm run import:schedule -- --file scripts/fixtures/sample_schedule.csv --map nonexistent.json
```

**Expected:**
- ❌ Error: "Mapping file not found"
- Exit code 1

### Test Missing Required Columns
```bash
# Create bad.csv with wrong headers
echo "WRONG,HEADERS,ONLY" > bad.csv
npm run import:schedule -- --file bad.csv --map lib/import/config/example.schedule.mapping.json
```

**Expected:**
- ❌ Error: "Missing required columns"
- Exit code 1

---

## 8. Verify in UI

### Check Search Results
1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000/search?term=20251`
3. Verify imported courses appear
4. Test GE filtering with imported requirements

**Expected:**
- ✅ Imported courses show in search
- ✅ GE filters work with imported requirements
- ✅ Schedule builder can add sections

---

## 9. Test Idempotency

### Run Same Import Twice
```bash
npm run import:schedule -- --file scripts/fixtures/sample_schedule.csv --map lib/import/config/example.schedule.mapping.json
npm run import:schedule -- --file scripts/fixtures/sample_schedule.csv --map lib/import/config/example.schedule.mapping.json
```

**Expected:**
- ✅ Second run updates existing records (doesn't create duplicates)
- ✅ Counts show "updated" instead of "created"
- ✅ No duplicate sections

---

## Quick Test Checklist

- [ ] Report script runs and shows data quality
- [ ] Valid schedule import works (dry-run and actual)
- [ ] Invalid schedule import fails validation
- [ ] Requirements import works
- [ ] Strict mode treats warnings as errors
- [ ] Import logs are created and readable
- [ ] Combined import runs both scripts
- [ ] Imported data appears in search UI
- [ ] Idempotent: running twice doesn't create duplicates
- [ ] Error handling works for edge cases

---

## Troubleshooting

**Issue:** "Term not found"
- **Fix:** Make sure term exists in database (run seed or import schedule first)

**Issue:** "Missing required columns"
- **Fix:** Check CSV headers match mapping config column names

**Issue:** Validation errors on valid data
- **Fix:** Check time format, day codes match expected format

**Issue:** Log files not created
- **Fix:** Check `import-logs/` directory exists and is writable

