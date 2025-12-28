# Grossmont Spring 2026 Import Instructions

## Quick Start

1. **PDF is already downloaded** at `data/grossmont/2026sp.pdf`

2. **Convert PDF to text** (choose one method):

   **Option A: Using pdftotext (Recommended)**
   ```bash
   # macOS
   brew install poppler
   pdftotext -layout data/grossmont/2026sp.pdf data/grossmont/2026sp.txt
   
   # Windows (WSL)
   sudo apt-get install poppler-utils
   pdftotext -layout data/grossmont/2026sp.pdf data/grossmont/2026sp.txt
   
   # Windows (Native) - Download from:
   # https://github.com/oschwartz10612/poppler-windows/releases
   # Add bin folder to PATH, then:
   pdftotext -layout data\grossmont\2026sp.pdf data\grossmont\2026sp.txt
   ```

   **Option B: Online Converter**
   - Use https://www.ilovepdf.com/pdf_to_txt or similar
   - Ensure layout is preserved (columns aligned)
   - Save as `data/grossmont/2026sp.txt`

3. **Run the import**:
   ```bash
   # Test first (dry run)
   npm run import:grossmont -- --dry-run
   
   # Actual import
   npm run import:grossmont
   ```

4. **Verify the import**:
   ```bash
   npm run report:term -- GROSSMONT_2026SP
   ```

## What Gets Imported

- **Term**: GROSSMONT_2026SP (Spring 2026, Feb 2 - Jun 1, 2026)
- **Courses**: All courses from the PDF
- **Sections**: All sections with class numbers
- **Meetings**: Day/time/location for each section
- **Instructors**: Linked to sections

## Expected Format

The parser expects text file with:
- Subject headers (all caps, no numbers): `COMPUTER SCIENCE`, `ENGLISH`, etc.
- Course rows: `119  1234  MWF  10:00-10:50  Smith  BLDG 210`

If parsing fails, check that:
1. Layout is preserved (columns align)
2. Subject headers are clearly separated
3. Course rows follow the expected pattern

## Troubleshooting

**"Text file not found"**
- Ensure `data/grossmont/2026sp.txt` exists
- Check file path is correct

**"No course rows found"**
- PDF text conversion may have lost formatting
- Try a different converter
- Check that subject headers are detected (all caps, no numbers)

**Parsing errors**
- The regex pattern may need adjustment for Grossmont's specific format
- Check sample lines in the text file
- Report format issues for script updates

