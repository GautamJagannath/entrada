# MVP UX Quick Implementation Guide
## Copy-Paste UI Components for 2-Hour Build

### 1. Essential ShadCN Components to Install
```bash
npx shadcn-ui@latest add card button input label form toast tabs badge progress alert select radio-group textarea separator
```

### 2. Base Layout Structure
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <h1 className="text-xl font-semibold text-gray-900">
                  Guardianship Forms
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Auto-saved 10 seconds ago
                  </span>
                  <Button variant="ghost" size="sm">
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
```

### 3. Progress Bar Component
```tsx
// components/ProgressBar.tsx
export function ProgressBar({ sections, currentSection }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              "text-xs font-medium",
              section.complete ? "text-green-600" : 
              section.current ? "text-blue-600" : "text-gray-400"
            )}
          >
            {section.name}
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${calculateProgress(sections)}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          />
        </div>
      </div>
    </div>
  );
}
```

### 4. Auto-Save Hook
```tsx
// hooks/useAutoSave.ts
import { useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { toast } from 'sonner';

export function useAutoSave(caseId: string, formData: any, setStatus: any) {
  const saveData = useCallback(
    debounce(async (data) => {
      setStatus('saving');
      try {
        await supabase
          .from('cases')
          .update({ 
            form_data: data,
            updated_at: new Date()
          })
          .eq('id', caseId);
        
        setStatus('saved');
        // Silent save - no toast unless error
      } catch (error) {
        setStatus('error');
        toast.error("Save failed - retrying...");
      }
    }, 2000),
    [caseId]
  );

  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      saveData(formData);
    }
  }, [formData]);
}
```

### 5. Dashboard Case Card
```tsx
// components/CaseCard.tsx
export function CaseCard({ case }) {
  const getStatusColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage > 70) return 'bg-blue-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {case.minor_name || 'Unnamed Minor'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Updated {formatRelativeTime(case.updated_at)}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{case.completion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    getStatusColor(case.completion)
                  )}
                  style={{ width: `${case.completion}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="ml-4">
            {case.completion === 100 ? (
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Generate PDFs
              </Button>
            ) : (
              <Button size="sm" variant="outline">
                Resume
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 6. Form Field with Validation
```tsx
// components/FormField.tsx
export function FormField({ 
  label, 
  required, 
  error, 
  helper, 
  ...props 
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {helper && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{helper}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
      <Input
        className={cn(
          "transition-all",
          error && "border-red-500 bg-red-50 focus:ring-red-500",
          !error && props.value && "border-green-500 bg-green-50"
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

### 7. Interview Navigation
```tsx
// components/InterviewNav.tsx
export function InterviewNav({ onPrevious, onNext, onSave, canGoNext }) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 mt-8">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          className="min-w-[100px]"
        >
          ← Previous
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={onSave}
          className="text-gray-600"
        >
          <Save className="h-4 w-4 mr-2" />
          Save & Exit
        </Button>
        
        <Button 
          onClick={onNext}
          disabled={!canGoNext}
          className="min-w-[100px]"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
```

### 8. Save Status Indicator
```tsx
// components/SaveStatus.tsx
export function SaveStatus({ status }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
          <span className="text-gray-600">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-gray-600">All changes saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3 text-red-600" />
          <span className="text-red-600">Unable to save</span>
        </>
      )}
    </div>
  );
}
```

### 9. Mobile-Responsive Grid
```tsx
// Use this pattern for form layouts
<div className="space-y-6">
  {/* Full width fields */}
  <FormField 
    label="Minor's Full Legal Name" 
    required 
  />
  
  {/* Two columns on desktop, stack on mobile */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField label="Date of Birth" type="date" required />
    <FormField label="Gender" type="select" required />
  </div>
  
  {/* Three columns on desktop, stack on mobile */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <FormField label="City" />
    <FormField label="State" />
    <FormField label="ZIP" />
  </div>
</div>
```

### 10. Quick Toast Patterns
```tsx
// Success
toast.success("Case created successfully");

// Error with action
toast.error("Connection lost", {
  action: {
    label: "Retry",
    onClick: () => retry()
  }
});

// Loading
const toastId = toast.loading("Generating PDFs...");
// Later...
toast.success("PDFs ready!", { id: toastId });
```

### Critical CSS for Professional Look
```css
/* globals.css */
@layer utilities {
  /* Smooth focus transitions */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  }
  
  /* Professional shadows */
  .card-shadow {
    @apply shadow-sm hover:shadow-md transition-shadow duration-200;
  }
  
  /* Status colors */
  .status-draft { @apply bg-gray-100 text-gray-800; }
  .status-partial { @apply bg-yellow-100 text-yellow-800; }
  .status-complete { @apply bg-green-100 text-green-800; }
  .status-error { @apply bg-red-100 text-red-800; }
}
```

### Color Variables
```css
/* app/globals.css */
:root {
  --primary: 37 99 235;        /* Blue */
  --success: 34 197 94;        /* Green */
  --warning: 234 179 8;        /* Yellow */
  --danger: 239 68 68;         /* Red */
  --muted: 107 114 128;        /* Gray */
}
```

## Implementation Order for 2-Hour Build

1. **First 30 min**: Install ShadCN components, set up layout
2. **Next 45 min**: Build form with FormField components and auto-save
3. **Next 30 min**: Add progress tracking and save indicators
4. **Final 15 min**: Polish with toasts, loading states, and mobile responsive

## Essential Testing Checklist
- [ ] Auto-save triggers after 2 seconds of inactivity
- [ ] Progress bar updates correctly
- [ ] Can resume from dashboard
- [ ] Mobile view is usable
- [ ] Error states show clearly
- [ ] Success feedback is visible
- [ ] Tab navigation works
- [ ] Required fields marked with red asterisk