# LEAN PRD - 2 Hour MVP
## California Guardianship Form Generator - Speed Build Edition

### Core Concept
Web app that collects guardianship data via guided interview → generates filled PDFs via Adobe API.

### Tech Stack (Copy-Paste Ready)
```bash
npx create-next-app@latest guardianship-forms --typescript --tailwind --app
cd guardianship-forms
npm install @supabase/supabase-js @adobe/pdfservices-node-sdk react-hook-form zod @hookform/resolvers zustand sonner lucide-react
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input label radio-group select textarea toast tabs
```

### MVP Architecture (2 Hours)
```
/app
  /api
    /generate-pdf → Adobe API endpoint
  /interview → Multi-step form
  /dashboard → List cases + download PDFs
  /login → Google SSO
```

### Database Schema (Supabase)
```sql
-- One table for MVP
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
  notes TEXT
);

-- RLS Policy
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see all cases" ON cases FOR ALL USING (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### Auto-Save Architecture
```typescript
// useAutoSave.ts - Custom hook for continuous saving
import { useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { supabase } from '@/lib/supabase';

export function useAutoSave(caseId: string, formData: any) {
  const saveData = useCallback(
    debounce(async (data) => {
      await supabase
        .from('cases')
        .update({ 
          form_data: data,
          completion_percentage: calculateCompletion(data)
        })
        .eq('id', caseId);
      
      toast("Saved", { duration: 1000 });
    }, 2000), // 2 second debounce
    [caseId]
  );

  useEffect(() => {
    saveData(formData);
  }, [formData]);
}
```

### Interview Flow Structure
```typescript
const sections = [
  { id: 'minor', title: 'Minor Information', fields: 25 },
  { id: 'guardian', title: 'Guardian Information', fields: 15 },
  { id: 'parent1', title: 'Parent 1', fields: 20 },
  { id: 'parent2', title: 'Parent 2', fields: 20 },
  { id: 'sijs', title: 'SIJS Factors', fields: 10 },
  { id: 'court', title: 'Court Info', fields: 5 }
];
```

### Critical Features Only
1. **Google SSO** via Supabase (10 min setup)
2. **Multi-step form** with progress bar
3. **AUTO-SAVE EVERY CHANGE** to Supabase (debounced 2 seconds)
4. **Resume any draft** from dashboard
5. **Generate PDFs** button → calls Adobe API (only when ready)
6. **Download forms** individually
7. **Visual indicators** for incomplete sections

### Adobe Integration (Simple)
```typescript
// /app/api/generate-pdf/route.ts
export async function POST(request: Request) {
  const { formType, caseData } = await request.json();
  
  // Map case data to form fields
  const fieldMappings = {
    'GC-210': {
      'minorName': caseData.minor.full_name,
      'minorDOB': caseData.minor.date_of_birth,
      // ... etc
    }
  };
  
  // Call Adobe API
  const filled = await fillPDF(
    `/templates/${formType}.pdf`,
    fieldMappings[formType]
  );
  
  // Save URL to Supabase
  return NextResponse.json({ url: filled.url });
}
```

### Skip for MVP
- Spanish translation (add later)
- Google Drive backup
- Complex branching logic
- Field validation beyond required
- Auto-delete after 14 days
- Edit existing cases

### Reality of Legal Intake (Must Handle)
- **Sessions are interrupted**: Clients get calls, have to leave
- **Information is incomplete**: "I'll get you that address tomorrow"
- **Multiple sessions**: Initial interview, follow-up with documents, corrections
- **Multiple contributors**: Paralegal starts, attorney adds notes, client provides updates
- **Partial data is normal**: Save everything, validate only on generation

### Draft Management
```typescript
// Dashboard shows draft status
interface CaseSummary {
  id: string;
  minor_name: string | 'Unnamed Minor';
  created_at: Date;
  updated_at: Date;
  completion_percentage: number;
  last_section: string;
  status: 'draft' | 'ready' | 'generated';
}

// Color-coded by completion
// 0-30%: red
// 31-70%: yellow  
// 71-99%: blue
// 100%: green
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADOBE_CLIENT_ID=
ADOBE_CLIENT_SECRET=
ADOBE_ORGANIZATION_ID=
```

### Quick Wins for Demo
- Hard-code law firm info
- Pre-fill demo data button
- Use toast notifications for "Saved" feedback
- Single "Generate All Forms" button
- **"Copy link to resume" button** (for sending to colleagues)
- **Session recovery** (if browser crashes, nothing lost)
- **Visual progress bar** showing completion percentage
- **"Save and close" button** (explicit save before leaving)

### 2-Hour Build Order
1. **0:00-0:15** - Setup Next.js, Supabase, install packages
2. **0:15-0:30** - Google SSO authentication  
3. **0:30-1:00** - Build multi-step form with AUTO-SAVE on every field
4. **1:00-1:15** - Dashboard to resume drafts + see completion %
5. **1:15-1:35** - Adobe API integration
6. **1:35-1:50** - PDF generation only when data complete
7. **1:50-2:00** - Test auto-save and resume functionality

### Form Field Mappings Needed
Each Judicial Council form has specific field names that must match exactly:
- GC-210: `form1[0].#subform[0].TextField1[0]` = minor's name
- GC-220: `form1[0].#subform[0].CheckBox1[0]` = reunification not viable
- (Get exact field names by opening PDFs in Adobe Acrobat)

### Deployment Checklist
- [ ] Download all Judicial Council form PDFs
- [ ] Set up Adobe PDF Services API account
- [ ] Create Supabase project
- [ ] Configure Google OAuth in Supabase
- [ ] Deploy to Vercel
- [ ] Test with one complete case

### Post-MVP Enhancements
- Add Spanish translations
- Implement branching logic
- Add field validation
- Google Drive backup
- Edit existing cases
- Progress auto-save
- Email notifications
- Print cover sheets

---

## Aesthetics & Operability

### Design Principles
- **Professional but approachable** - Trust-building blue palette
- **Clear visual hierarchy** - Users always know where they are
- **Responsive feedback** - Every action confirmed (saves, errors, progress)
- **Mobile-friendly** - Attorneys review on phones constantly
- **Accessibility** - WCAG 2.1 AA compliant for diverse users

### Core UX Features
```jsx
// Visual progress with color coding
<ProgressBar 
  sections={[
    { name: "Minor", status: "complete", color: "green" },
    { name: "Guardian", status: "partial", color: "yellow" },
    { name: "Parents", status: "empty", color: "gray" }
  ]}
/>

// Auto-save indicator
<SaveStatus status={saveStatus} lastSaved={lastSaved} />

// One-click resume from dashboard
<Button onClick={() => router.push(`/interview/${caseId}`)}>
  Resume (65% complete)
</Button>

// Clear validation states
<Input 
  className={cn(
    "transition-all",
    error && "border-red-500 bg-red-50",
    value && !error && "border-green-500 bg-green-50"
  )}
/>
```

### Key Interactions
- **Debounced auto-save** - 2 second delay after typing stops
- **Section collapse/expand** - Navigate without losing context  
- **Inline validation** - Errors shown without disrupting flow
- **Smart defaults** - "California" pre-selected, today's date for filing
- **Bulk actions** - "Generate all forms" vs individual generation
- **Recovery mode** - If connection lost, local storage takes over