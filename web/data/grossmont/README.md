# Grossmont College Schedule Import

This directory contains the Grossmont College Spring 2026 schedule data.

## Files

- `2026sp.pdf` - Original PDF schedule (downloaded from Grossmont website)
- `2026sp.txt` - Text version of the PDF (required for import)

## PDF to Text Conversion

Before running the import, you must convert the PDF to a text file while preserving the layout.

### Option 1: Using pdftotext (Recommended)

**macOS:**
```bash
brew install poppler
pdftotext -layout data/grossmont/2026sp.pdf data/grossmont/2026sp.txt
```

**Windows (WSL):**
```bash
sudo apt-get install poppler-utils
pdftotext -layout data/grossmont/2026sp.pdf data/grossmont/2026sp.txt
```

**Windows (Native):**
1. Download poppler for Windows: https://github.com/oschwartz10612/poppler-windows/releases
2. Extract and add `bin` folder to PATH
3. Run: `pdftotext -layout data\grossmont\2026sp.pdf data\grossmont\2026sp.txt`

### Option 2: Online Converter

If pdftotext is not available:
1. Use an online PDF to text converter (e.g., https://www.ilovepdf.com/pdf_to_txt)
2. Ensure layout is preserved (columns should align)
3. Save as `data/grossmont/2026sp.txt`

### Option 3: Manual Copy-Paste

As a last resort, you can copy-paste from the PDF, but ensure:
- Column alignment is preserved
- Each course row is on a single line
- Subject headers are clearly separated

## Running the Import

Once `2026sp.txt` exists:

```bash
# Dry run (test without database changes)
npm run import:grossmont -- --dry-run

# Actual import
npm run import:grossmont
```

## Expected Output

The import will:
1. Create/update the term "GROSSMONT_2026SP"
2. Upsert all courses
3. Create/update all sections
4. Create meetings for each section
5. Link instructors to sections

## Verification

After import, verify the data:

```bash
npm run report:term -- GROSSMONT_2026SP
```

