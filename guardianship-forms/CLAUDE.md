# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: 2025-10-01 by Claude Sonnet 4.5

---

## 🎯 Quick Summary for Claude

**What's working**: ✅ Authentication, multi-step interview, auto-save, case management, dashboard, and **PDF generation (Vercel-compatible)**

**PDF Solution**: Pure pdf-lib generation (works in Vercel serverless functions)

**Why pdf-lib**: California court PDFs use XFA forms that cannot be filled. Puppeteer and PDFKit don't work in Vercel's serverless environment. Pure pdf-lib generates simple but functional court forms without external dependencies.

**Key files**:
- `lib/vercel-pdf-generator.ts` - PDF generation using only pdf-lib (Vercel-compatible)
- `lib/adobe-pdf-services.ts` - PDF service integration wrapper
- `app/interview/[id]/page.tsx` - Interview form UI with multiple siblings support
- `app/api/generate-pdf/route.ts` - PDF generation endpoint with detailed logging
- `app/dashboard/page.tsx` - Case dashboard with sequential PDF downloads
- `hooks/useAutoSave.ts` - Auto-save logic (2s debounce)

---

## Project Overview

This is a California Guardianship Form Generator web application designed to collect guardianship data via guided interview and generate filled PDFs. The project is built for legal professionals to streamline SIJS (Special Immigrant Juvenile Status) guardianship cases.

**Current Status**: ✅ Fully functional MVP - Authentication, interview, auto-save, and **PDF generation working**. Uses pure pdf-lib to generate simple court forms that work in Vercel serverless.

## Tech Stack (Actual Implementation)

- **Framework**: Next.js 15.5.3 with TypeScript 5.x (App Router)
- **Runtime**: React 19.1.0
- **Styling**: Tailwind CSS 4.x + ShadCN UI components
- **Database**: Supabase with PostgreSQL + Row Level Security
- **Authentication**: Google SSO via Supabase Auth (implicit flow)
- **PDF Generation**: pdf-lib 1.17.1 (Vercel serverless-compatible)
- **Form Handling**: React Hook Form 7.62.0 + Zod 4.1.8 validation
- **State Management**: Zustand 5.0.8
- **Notifications**: Sonner 2.0.7 (toast library)
- **Email**: Resend API 6.0.3

## Initial Setup Commands

```bash
# Create Next.js project
npx create-next-app@latest guardianship-forms --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js @adobe/pdfservices-node-sdk react-hook-form zod @hookform/resolvers zustand sonner lucide-react

# Install ShadCN UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input label radio-group select textarea toast tabs badge progress alert separator
```

## Database Schema

Single table design for MVP:

```sql
-- Enhanced schema with security and collaboration
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  form_data JSONB NOT NULL DEFAULT '{}',
  last_section_completed TEXT,
  completion_percentage INTEGER DEFAULT 0,
  generated_pdfs JSONB,
  minor_name TEXT GENERATED ALWAYS AS (form_data->>'minor_full_name') STORED,
  notes TEXT,
  supporting_docs JSONB DEFAULT '{}', -- File uploads
  collaborators JSONB DEFAULT '[]'    -- Multi-user access
);

-- User-scoped security policy (CRITICAL FIX)
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own cases" ON cases FOR ALL USING (user_email = auth.email());
```

## Project Structure

```
guardianship-forms/
├── app/
│   ├── api/
│   │   ├── generate-pdf/route.ts      # PDF generation endpoint (pdf-lib)
│   │   └── send-forms/route.ts        # Email delivery endpoint (Resend)
│   ├── interview/[id]/page.tsx        # Multi-step interview with auto-save
│   ├── dashboard/page.tsx             # Case list + PDF generation
│   ├── login/page.tsx                 # Google SSO login
│   ├── auth/callback/page.tsx         # OAuth callback handler
│   └── settings/page.tsx              # User settings
├── components/
│   ├── ui/                            # ShadCN UI components
│   ├── HeaderAuth.tsx                 # Header authentication
│   └── UserMenu.tsx                   # User menu dropdown
├── hooks/
│   └── useAutoSave.ts                 # Auto-save hook (2s debounce)
├── lib/
│   ├── adobe-pdf-services.ts          # PDF generation service (pdf-lib)
│   ├── cases.ts                       # Case CRUD operations
│   ├── supabase.ts                    # Supabase client
│   ├── auth.tsx                       # Auth context
│   ├── email-service.ts               # Resend email service
│   └── utils.ts                       # Utility functions
└── public/
    └── templates/                     # California court form PDFs
        ├── GC-210.pdf                 # Petition (168 fields)
        ├── GC-220.pdf                 # SIJS Petition (168 fields)
        ├── FL-105.pdf                 # UCCJEA (257 fields)
        ├── GC-020.pdf                 # Notice of Hearing (168 fields)
        └── GC-210P.pdf                # Child Info (193 fields)
```

## Key Features & Requirements

### Auto-Save System
- **Critical**: Save every 2 seconds after user stops typing (debounced)
- Visual indicator showing save status (saving/saved/error)
- No data loss even if browser crashes
- Resume from any point via dashboard

### Form Sections (Multi-step Interview)
1. **Minor Information** (25 fields) - Name, DOB, address, citizenship, school, siblings
2. **Guardian Information** (15 fields) - Guardian details, relationship, background
3. **Parent 1** (20 fields) - Mother's info, contact, reunification status
4. **Parent 2** (20 fields) - Father's info, contact, reunification status
5. **SIJS Factors** (10 fields) - Best interest, harm, trauma evidence
6. **Court Info** (5 fields) - Filing location, emergency status, interpreter needs

**Total**: 95 fields tracked for completion percentage

### PDF Forms Generated
- **GC-210**: Petition for Appointment of Guardian (168 AcroForm fields)
- **GC-220**: SIJS Findings and Orders (168 AcroForm fields)
- **FL-105**: UCCJEA Declaration (257 AcroForm fields)
- **GC-020**: Notice of Hearing (168 AcroForm fields)
- **GC-210P**: Child Information Attachment (193 AcroForm fields)

**Total**: 954 fillable fields across all forms

## Design System

### Colors (Professional Legal Theme)
```css
--primary: #2563eb;        /* Blue */
--success: #16a34a;        /* Green for completed sections */
--warning: #eab308;        /* Yellow for partial data */
--danger: #dc2626;         /* Red for errors */
--muted: #6b7280;          /* Gray for helper text */
--background: #fafafa;     /* Off-white background */
```

### Progress Indication
- Color-coded sections: Green (complete), Blue (in-progress), Yellow (partial), Gray (empty)
- Percentage completion calculation
- Visual progress bar across all sections

## Critical UX Patterns

### Progressive Disclosure (Essential for 122 Fields)
```tsx
// Instead of showing all 25 minor fields at once, reveal progressively
function MinorSection() {
  const [formData, setFormData] = useState({});

  return (
    <div className="space-y-6">
      {/* Always visible: Core info */}
      <Input label="Minor's Full Name" required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date of Birth" type="date" required />
        <Select label="Gender" required />
      </div>

      {/* Conditional: Only show if non-citizen */}
      <RadioGroup label="Is the minor a US citizen?"
        onValueChange={(value) => setFormData(prev => ({ ...prev, isCitizen: value }))}>
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
      </RadioGroup>

      {formData.isCitizen === 'no' && (
        <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-blue-200">
          <Input label="A-Number" />
          <Select label="Immigration Status" />
          <Input label="Country of birth" />
        </div>
      )}

      {/* Conditional: Only show if has siblings */}
      <RadioGroup label="Does the minor have siblings?">
        <Radio value="no">No siblings</Radio>
        <Radio value="yes">Has siblings</Radio>
      </RadioGroup>

      {formData.hasSiblings === 'yes' && (
        <div className="animate-in slide-in-from-top-2">
          <SiblingRepeater />
        </div>
      )}
    </div>
  );
}
```

**Benefits:**
- Reduces overwhelming 122 fields to 3-5 visible at a time
- Contextual - only relevant fields appear
- Maintains auto-save functionality
- Better mobile experience
- Faster perceived completion

### Mobile-First Responsive
```jsx
// Standard responsive grid pattern
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField label="Date of Birth" type="date" />
  <FormField label="Gender" type="select" />
</div>
```

### Auto-Save Hook Pattern
```typescript
export function useAutoSave(caseId: string, formData: any) {
  const saveData = useCallback(
    debounce(async (data) => {
      await supabase.from('cases').update({
        form_data: data,
        completion_percentage: calculateCompletion(data)
      }).eq('id', caseId);
    }, 2000),
    [caseId]
  );
}
```

### Field Validation States
- Default: Gray border
- Focus: Blue border with subtle glow
- Valid: Green border + background tint
- Error: Red border + background tint
- Required fields: Red asterisk

## Development Workflow

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADOBE_CLIENT_ID=
ADOBE_CLIENT_SECRET=
ADOBE_ORGANIZATION_ID=
```

### Testing Commands
```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint
npm run type-check # TypeScript checking
```

## Legal Form Requirements

### Data Collection Reality
- Sessions are frequently interrupted (calls, emergencies)
- Information comes in multiple sessions over time
- Partial data is normal and expected
- Multiple people may contribute to same case
- Validation only required before PDF generation, not during data entry

### SIJS-Specific Logic
- Minor must be under 21 and unmarried
- At least one parent must have "no reunification" basis
- Specific grounds required: abuse, neglect, abandonment, or similar state law basis
- Must establish why remaining in US is in minor's best interest

### Form Field Mappings (CRITICAL ISSUE)

**Problem**: California court forms use AcroForm fields with hierarchical naming:
- Example: `topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]`
- These are **encrypted PDFs** requiring `ignoreEncryption: true` with pdf-lib
- Current implementation uses **text overlay** which doesn't actually fill the form fields
- Result: PDFs generate but fields remain empty (visual text only, not form data)

**Current Approach** (`lib/adobe-pdf-services.ts`):
```typescript
// ❌ This draws text on top of the PDF but doesn't fill fields
page.drawText(value.toString(), {
  x: position.x,
  y: position.y,
  size: 10,
  font: helveticaFont
});
```

**What's Needed**:
```typescript
// ✅ This actually fills the AcroForm fields
const form = pdfDoc.getForm();
const field = form.getTextField('topmostSubform[0].Page1[0].FieldName[0]');
field.setText(value.toString());
```

**Field Analysis**: See `public/templates/pdf_field_analysis_summary.md` for complete field inventory across all 5 forms.

## Special Considerations

### Accessibility (WCAG 2.1 AA)
- Proper ARIA labels on all form fields
- Keyboard navigation support
- Screen reader compatibility
- Focus management between sections

### Legal Language Toggle
- Switch between legal terms and plain English
- Contextual help text for complex fields
- Tooltips for field explanations

### Multi-language Support (Future)
- Spanish translation for high-priority fields
- Legal terminology translation
- Right-to-left language support

## Current Implementation Status

### ✅ Working Features
- Google OAuth authentication (implicit flow)
- Case creation and management with RLS
- Multi-step interview form (6 sections, 95 fields)
- Multiple siblings support (dynamic fields, up to 10 siblings)
- Auto-save every 2 seconds (debounced)
- Progress tracking and completion percentage
- Dashboard with search and filtering
- **PDF Generation using pure pdf-lib** (Vercel serverless-compatible)
- Sequential PDF downloads (4 forms: GC-210, GC-220, FL-105, GC-020)
- Detailed logging for debugging

### ⚠️ Known Issues / Limitations
1. **PDF Forms are Simplified** - Generated PDFs are simple text-based forms, not official California court forms
   - Root cause: California XFA forms cannot be filled programmatically
   - Puppeteer/PDFKit don't work in Vercel serverless environment
   - Current solution: Generate clean, professional-looking forms with all data
   - PDFs are ~1.5-1.7KB each and contain all required information
   - May need manual transfer to official forms for court filing

2. **Sequential Download Required** - Browser needs delay between downloads
   - PDFs download one at a time with 500ms delays
   - Prevents browser from concatenating multiple files into one

3. **Email Service** - Resend API in sandbox mode
   - Only sends to verified email addresses
   - Need production API key for real deployment

### 🔧 Deployment Status
- [x] Download all Judicial Council form PDFs (in `public/templates/`)
- [x] Create Supabase project with RLS policies
- [x] Configure Google OAuth in Supabase
- [x] Set up environment variables
- [x] Implement PDF generation (Vercel-compatible with pdf-lib)
- [x] Deploy to Vercel
- [x] Fix multiple siblings support
- [x] Add sequential PDF downloads
- [ ] Test complete workflow with real case data
- [ ] Configure production Resend API key
- [ ] Consider future enhancement: Professional PDF templates

## PDF Generation Evolution

### Journey from XFA to pdf-lib

**Attempt 1: AcroForm Field Filling**
- Tried to fill official California court PDFs using pdf-lib's form API
- Issue: PDFs use XFA (XML Forms Architecture) which pdf-lib cannot parse
- Result: 0 fields detected in forms that should have 168+ fields

**Attempt 2: Puppeteer HTML-to-PDF**
- Created HTML templates matching court form layouts
- Issue: Puppeteer requires Chrome/Chromium not available in Vercel serverless
- Result: Works locally but fails on Vercel deployment

**Attempt 3: PDFKit**
- Switched to PDFKit for Node.js streams-based PDF generation
- Issue: PDFKit uses native dependencies incompatible with Vercel
- Result: TypeScript compilation errors, serverless incompatibility

**Attempt 4: Pure pdf-lib (Current Solution)** ✅
- Uses only pdf-lib with StandardFonts (no external dependencies)
- Generates simple but professional-looking forms
- Works perfectly in Vercel's serverless environment
- Sequential downloads prevent browser concatenation issues
- Each PDF ~1.5-1.7KB with all case data included

## Future Enhancements

### Option 1: Professional PDF Templates
- Use a service like DocuSign, HelloSign, or PDF.co
- Pre-designed templates that match California court forms exactly
- API-based filling that works in serverless

### Option 2: Client-Side PDF Generation
- Move PDF generation to browser using pdf-lib client-side
- Larger bundle size but guaranteed compatibility
- No serverless limitations

### Option 3: Manual Form Transfer
- Current PDFs serve as data collection/summary
- Legal professionals manually transfer to official forms
- Simple, reliable, low-tech solution

### Archived: How to Work with California Court PDFs

```typescript
import { PDFDocument } from 'pdf-lib';

// Load PDF with encryption bypass
const pdfBytes = fs.readFileSync('public/templates/GC-210.pdf');
const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

// Get the form object
const form = pdfDoc.getForm();

// List all fields (for debugging)
const fields = form.getFields();
fields.forEach(field => {
  const name = field.getName();
  const type = field.constructor.name;
  console.log(`${type}: ${name}`);
});

// Fill text fields
const textField = form.getTextField('topmostSubform[0].Page1[0].FieldName[0]');
textField.setText('John Doe');

// Fill checkboxes
const checkbox = form.getCheckBox('topmostSubform[0].Page1[0].CheckBox[0]');
checkbox.check();

// Save the filled PDF
const filledPdfBytes = await pdfDoc.save();
```

### Step 2: Extract Field Names from PDFs

**Option A: Use pdf-lib programmatically**
```bash
cd guardianship-forms
node -e "
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

(async () => {
  const pdf = await PDFDocument.load(fs.readFileSync('public/templates/GC-210.pdf'), { ignoreEncryption: true });
  const form = pdf.getForm();
  const fields = form.getFields();

  console.log('GC-210 Fields:');
  fields.forEach(f => console.log(f.getName()));
})();
"
```

**Option B: Use Adobe Acrobat Pro**
1. Open PDF in Acrobat Pro
2. Tools → Prepare Form
3. Right-click each field → Properties → Name

**Option C: Check existing analysis**
- File: `public/templates/pdf_field_analysis_summary.md`
- Contains partial field inventory

### Step 3: Create Complete Field Mappings

Update `lib/adobe-pdf-services.ts`:

```typescript
private mapCaseDataToFormFields(caseData: any, formType: string): PDFFormData {
  const formData = caseData.form_data || {};

  switch (formType) {
    case 'GC-210':
      return {
        // Court header (appears on all pages)
        'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]':
          formData.filing_county || '',

        'topmostSubform[0].Page1[0].StdP1Header_sf[0].CaseNumber[0].CaseNumber_ft[0]':
          caseData.id || '',

        // Attorney information
        'topmostSubform[0].Page1[0].StdP1Header_sf[0].AttyInfo_sf[0].AttyName_ft[0]':
          formData.attorney_name || '',

        'topmostSubform[0].Page1[0].StdP1Header_sf[0].AttyInfo_sf[0].AttyBarNo_dc[0]':
          formData.attorney_bar_number || '',

        // Minor information
        'topmostSubform[0].Page1[0].MinorName_ft[0]':
          formData.minor_full_name || '',

        'topmostSubform[0].Page1[0].MinorDOB_dt[0]':
          formData.minor_date_of_birth || '',

        // ... map all 168 fields for GC-210
      };

    case 'GC-220':
      return {
        // SIJS-specific fields
        'topmostSubform[0].Page1[0].BestInterest_cb[0]':
          formData.sijs_best_interest ? 'Yes' : '',

        // ... map all 168 fields for GC-220
      };

    // ... other forms
  }
}
```

### Step 4: Update fillPDFForm() Method

Replace text overlay with form field filling:

```typescript
async fillPDFForm(options: GeneratePDFOptions): Promise<Buffer> {
  try {
    // Load PDF
    const existingPdfBytes = fs.readFileSync(options.templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes, {
      ignoreEncryption: true
    });

    // Get form
    const form = pdfDoc.getForm();

    // Fill fields
    let fieldsFilledCount = 0;
    for (const [fieldName, fieldValue] of Object.entries(options.formData)) {
      if (!fieldValue || fieldValue.toString().trim() === '') continue;

      try {
        // Try to get the field
        const field = form.getField(fieldName);

        // Fill based on field type
        if (field.constructor.name === 'PDFTextField') {
          const textField = form.getTextField(fieldName);
          textField.setText(fieldValue.toString());
          fieldsFilledCount++;
        } else if (field.constructor.name === 'PDFCheckBox') {
          const checkbox = form.getCheckBox(fieldName);
          if (fieldValue === true || fieldValue === 'Yes' || fieldValue === 'yes') {
            checkbox.check();
          }
          fieldsFilledCount++;
        } else if (field.constructor.name === 'PDFRadioGroup') {
          const radioGroup = form.getRadioGroup(fieldName);
          radioGroup.select(fieldValue.toString());
          fieldsFilledCount++;
        }
      } catch (error) {
        console.warn(`Could not fill field ${fieldName}:`, error.message);
      }
    }

    console.log(`Filled ${fieldsFilledCount} fields out of ${Object.keys(options.formData).length}`);

    // Optionally flatten the form (makes it non-editable)
    // form.flatten();

    // Save
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);

  } catch (error) {
    console.error('PDF filling error:', error);
    throw error;
  }
}
```

### Step 5: Test PDF Generation

```bash
# Run dev server
npm run dev

# Test in browser
# 1. Go to http://localhost:3000/dashboard
# 2. Create a new case
# 3. Fill out interview form
# 4. Click "Generate PDFs"
# 5. Download and open PDF in Acrobat/Preview
# 6. Verify fields are filled (not just text overlay)
```

### Step 6: Debugging Tips

**Check if fields are fillable:**
```typescript
const form = pdfDoc.getForm();
const fields = form.getFields();

console.log(`Total fields: ${fields.length}`);
fields.forEach(field => {
  console.log(`Name: ${field.getName()}`);
  console.log(`Type: ${field.constructor.name}`);

  if (field.constructor.name === 'PDFTextField') {
    const textField = field as PDFTextField;
    console.log(`Max length: ${textField.getMaxLength()}`);
    console.log(`Current value: ${textField.getText()}`);
  }
});
```

**Common issues:**
- Field name typos (case-sensitive, must match exactly)
- Field is read-only or calculated
- Field has validation rules that reject the value
- PDF encryption prevents modification (use `ignoreEncryption: true`)

## Common Patterns

When implementing form sections, always include:
- Section progress indicator
- Auto-save on field blur
- Clear navigation (Previous/Next/Save & Exit)
- Field validation with clear error messages
- Help text for complex legal concepts
- Mobile-responsive layout
- Keyboard accessibility