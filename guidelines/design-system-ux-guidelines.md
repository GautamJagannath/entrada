# Design System & UX Guidelines
## California Guardianship Forms Interface

### Visual Identity

#### Color Palette
```css
/* Professional Legal Theme with ShadCN */
--primary: #2563eb;        /* Trustworthy blue for primary actions */
--primary-hover: #1d4ed8;  
--success: #16a34a;        /* Green for completed sections */
--warning: #eab308;        /* Yellow for partial data */
--danger: #dc2626;         /* Red for errors/missing required */
--muted: #6b7280;          /* Gray for helper text */
--background: #fafafa;     /* Slight off-white, easier on eyes */
--card: #ffffff;           /* Pure white for cards */
--border: #e5e7eb;         /* Subtle borders */

/* Dark mode (optional but helpful for long sessions) */
--dark-bg: #0f172a;
--dark-card: #1e293b;
```

#### Typography
```css
/* Using Inter for readability */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* Type Scale */
--text-xs: 0.75rem;    /* Timestamps, meta */
--text-sm: 0.875rem;   /* Helper text */
--text-base: 1rem;     /* Body text */
--text-lg: 1.125rem;   /* Section headers */
--text-xl: 1.25rem;    /* Page titles */
--text-2xl: 1.5rem;    /* Main headings */

/* Legal documents need excellent readability */
line-height: 1.6;
letter-spacing: -0.01em;
```

---

### Core UI Patterns

#### 1. Dashboard (Case List View)
```
┌─────────────────────────────────────────────────────────┐
│ [Logo] Guardianship Forms          [👤 John Doe] [Logout]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────┐    │
│ │ 📊 Your Cases                      [+ New Case]  │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ ┌──────────────────────────────────────────────────┐    │
│ │ 🔍 Search by minor name...         [Filter ▼]    │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ ┌──────────────────────────────────────────────────┐    │
│ │ Minor Name ↓│ Status │ Progress │ Updated │ Actions│   │
│ ├──────────────────────────────────────────────────┤    │
│ │ Garcia, M   │ Draft  │ ████░░░ 65% │ 2 min │ [Resume]│ │
│ │ Chen, L     │ Ready  │ ████████ 100%│ 1 hour│ [Generate]│
│ │ Smith, A    │ Draft  │ ██░░░░░ 30% │ 2 days│ [Resume]│ │
│ └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Visual progress bars** with color coding
- **One-click actions** (Resume/Generate)
- **Smart sorting** (most recent first)
- **Search as you type** with debouncing
- **Status badges** with clear colors

#### 2. Interview Interface (Data Collection)
```
┌─────────────────────────────────────────────────────────┐
│ [← Back to Dashboard]            Auto-saved 10 seconds ago│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Progress: Minor ████ Guardian ████ Parents ██░░ SIJS ░░░│ 
│                                                          │
│ ┌──────────────────────────────────────────────────┐    │
│ │                                                   │    │
│ │  Minor Information (Step 1 of 6)                 │    │
│ │                                                   │    │
│ │  ┌────────────────────────────────────────┐      │    │
│ │  │ Full Legal Name *                       │      │    │
│ │  │ [Maria Elena Garcia Hernandez     ]     │      │    │
│ │  │ ⓘ As it appears on birth certificate   │      │    │
│ │  └────────────────────────────────────────┘      │    │
│ │                                                   │    │
│ │  ┌─────────────┐  ┌─────────────┐               │    │
│ │  │ Date of Birth│  │ Gender      │               │    │
│ │  │ [MM/DD/YYYY] │  │ [Select ▼]  │               │    │
│ │  └─────────────┘  └─────────────┘               │    │
│ │                                                   │    │
│ │  📍 Current Address                               │    │
│ │  ┌────────────────────────────────────────┐      │    │
│ │  │ Street Address                          │      │    │
│ │  │ [123 Main Street, Apt 4B          ]    │      │    │
│ │  ├────────────────┬───────────┬───────────┤      │    │
│ │  │ City           │ State     │ ZIP       │      │    │
│ │  │ [Oakland     ] │ [CA ▼]    │ [94601]   │      │    │
│ │  └────────────────┴───────────┴───────────┘      │    │
│ │                                                   │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ [← Previous]  [Save & Exit]  [Skip Section]  [Next →]   │
└─────────────────────────────────────────────────────────┘
```

**Key UX Principles:**
- **Clear visual hierarchy** - Section > Field Group > Field
- **Inline help text** - Context without clutter
- **Smart defaults** - "CA" pre-selected for state
- **Flexible navigation** - Previous/Next/Skip/Save & Exit
- **Persistent progress indicator** - Always know where you are
- **Auto-save indicator** - Peace of mind

#### 3. Field States & Validation

```css
/* Default Field */
.field-default {
  border: 1px solid #e5e7eb;
  background: white;
  /* Subtle focus animation */
  transition: all 0.2s ease;
}

/* Focused Field - Clear visual feedback */
.field-focus {
  border: 2px solid #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  /* Slightly enlarged for visibility */
  transform: scale(1.01);
}

/* Valid Field - Subtle success */
.field-valid {
  border: 1px solid #16a34a;
  background: #f0fdf4;
}

/* Error Field - Clear but not alarming */
.field-error {
  border: 1px solid #dc2626;
  background: #fef2f2;
}

/* Disabled Field */
.field-disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### 4. Smart Interactions

**Progressive Disclosure:**
```typescript
// Only show complex fields when needed
{isMinorNonCitizen && (
  <div className="slide-in">
    <Input label="A-Number" />
    <Select label="Immigration Status" />
  </div>
)}
```

**Contextual Help:**
```jsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <InfoCircle className="h-4 w-4 text-muted" />
    </TooltipTrigger>
    <TooltipContent>
      <p>The A-Number is the 8 or 9 digit number on immigration documents</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Smart Field Groups:**
```jsx
// Visually group related fields
<Card className="p-4 space-y-4">
  <h3 className="font-medium text-lg">Parent 1 - Mother</h3>
  <div className="grid grid-cols-2 gap-4">
    <Input label="Full Name" />
    <Input label="Maiden Name" />
  </div>
  <RadioGroup label="Living Status">
    <Radio value="alive">Living</Radio>
    <Radio value="deceased">Deceased</Radio>
    <Radio value="unknown">Unknown</Radio>
  </RadioGroup>
</Card>
```

---

### Mobile Responsiveness

```jsx
// Interview form adapts to mobile
<div className="container mx-auto px-4 max-w-2xl">
  {/* Single column on mobile, two columns on desktop */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Full width on mobile */}
    <div className="col-span-1 md:col-span-2">
      <Input label="Full Name" />
    </div>
    {/* Side by side on desktop, stacked on mobile */}
    <Input label="Date of Birth" />
    <Select label="Gender" />
  </div>
</div>

// Mobile-optimized navigation
<div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:relative md:border-0">
  <div className="flex justify-between">
    <Button variant="outline">Previous</Button>
    <Button>Next</Button>
  </div>
</div>
```

---

### Accessibility (WCAG 2.1 AA)

```jsx
// Proper ARIA labels
<div role="group" aria-labelledby="parent-section">
  <h2 id="parent-section">Parent Information</h2>
  
  <label htmlFor="mother-name" className="sr-only">
    Mother's full legal name
  </label>
  <input 
    id="mother-name"
    aria-required="true"
    aria-invalid={errors.motherName ? "true" : "false"}
    aria-describedby="mother-name-error"
  />
  
  {errors.motherName && (
    <span id="mother-name-error" role="alert" className="text-danger text-sm">
      This field is required
    </span>
  )}
</div>

// Keyboard navigation
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNext();
    }
  }}
/>

// Focus management
useEffect(() => {
  // Focus first field on section change
  firstFieldRef.current?.focus();
}, [currentSection]);
```

---

### Micro-interactions & Feedback

#### Save Status Indicator
```jsx
function SaveIndicator({ status }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-muted">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-success" />
          <span className="text-muted">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3 text-danger" />
          <span className="text-danger">Save failed - retrying</span>
        </>
      )}
    </div>
  );
}
```

#### Progress Animation
```css
@keyframes progress-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.progress-bar {
  transition: width 0.5s ease-out;
}

.progress-bar.active-section {
  animation: progress-pulse 2s infinite;
}
```

#### Toast Notifications
```jsx
// Success
toast.success("Forms generated successfully!", {
  description: "9 PDFs ready for download",
  action: {
    label: "View",
    onClick: () => navigateToDownloads(),
  },
});

// Warning
toast.warning("Some optional fields are empty", {
  description: "You can still generate forms or continue editing",
});

// Error with retry
toast.error("Connection lost", {
  description: "Your data is saved locally. Retrying...",
  duration: Infinity, // Don't auto-dismiss
});
```

---

### Special Legal UX Considerations

#### 1. Confidence Indicators
```jsx
// Show data confidence levels
<div className="flex items-center gap-2">
  <Input label="Date of Last Contact" />
  <Select label="Certainty">
    <option>Exact date</option>
    <option>Approximate month</option>
    <option>Year only</option>
    <option>Unknown</option>
  </Select>
</div>
```

#### 2. Legal Language Toggle
```jsx
// Switch between legal/plain language
<Toggle 
  pressed={showLegalTerms}
  onPressedChange={setShowLegalTerms}
>
  {showLegalTerms ? "Legal Terms" : "Plain English"}
</Toggle>

{showLegalTerms 
  ? "Petitioner seeks appointment as guardian ad litem"
  : "Person asking to be the child's guardian"
}
```

#### 3. Document Upload Areas
```jsx
<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
  <Upload className="mx-auto h-12 w-12 text-gray-400" />
  <p className="mt-2 text-sm text-gray-600">
    Drop birth certificate here or click to browse
  </p>
  <p className="text-xs text-gray-500 mt-1">
    PDF, JPG, PNG up to 10MB
  </p>
</div>
```

#### 4. Review Mode
```jsx
// Different visual treatment for review
<div className="review-mode bg-gray-50 p-6 rounded-lg">
  <div className="flex justify-between items-start mb-4">
    <h3 className="font-medium">Minor Information</h3>
    <Button size="sm" variant="ghost" onClick={editSection}>
      <Edit className="h-4 w-4" />
    </Button>
  </div>
  
  <dl className="grid grid-cols-1 gap-2 text-sm">
    <div className="flex justify-between">
      <dt className="text-muted">Name:</dt>
      <dd className="font-medium">Maria Elena Garcia</dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-muted">DOB:</dt>
      <dd className="font-medium">01/15/2008</dd>
    </div>
  </dl>
</div>
```

---

### Performance Optimizations

```jsx
// Virtualized lists for many entries
import { VirtualList } from '@tanstack/react-virtual';

// Lazy load sections
const SIJSSection = lazy(() => import('./sections/SIJS'));

// Debounced auto-save
const debouncedSave = useMemo(
  () => debounce(saveToSupabase, 2000),
  []
);

// Optimistic updates
const updateField = (name, value) => {
  // Update UI immediately
  setFormData(prev => ({ ...prev, [name]: value }));
  // Save in background
  debouncedSave({ [name]: value });
};
```

---

### Error Recovery

```jsx
// Network failure handling
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
  <div className="flex">
    <WifiOff className="h-5 w-5 text-yellow-600 mt-0.5" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-yellow-800">
        Working Offline
      </h3>
      <p className="mt-1 text-sm text-yellow-700">
        Your changes are being saved locally and will sync when reconnected.
      </p>
    </div>
  </div>
</div>
```

---

### Quick Action Patterns

```jsx
// Floating Action Button for mobile
<div className="fixed bottom-20 right-4 md:hidden">
  <Button 
    size="lg" 
    className="rounded-full shadow-lg h-14 w-14"
    onClick={quickSave}
  >
    <Save className="h-6 w-6" />
  </Button>
</div>

// Keyboard shortcuts
useHotkeys('cmd+s', () => saveForm());
useHotkeys('cmd+enter', () => goToNext());
useHotkeys('esc', () => openExitDialog());
```