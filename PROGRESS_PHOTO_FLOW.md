# Progress Photo Flow Documentation

## Overview

The progress photo flow at `/dashboard/check-in/photos` is an optional, anxiety-minimizing experience for capturing baseline progress photos. It's designed to be emotionally supportive while protecting privacy and building confidence.

## User Journey (6 Screens)

### 1. Purpose Reframe
- **Message**: "A Gift to Tomorrow" — these photos are for the you 8 weeks from here
- **Tone**: Reframes photos as progress tracking, not judgment
- **Options**: Begin or Skip for Now

### 2. Privacy Assurance
- **Icon**: Lock icon with teal glow
- **Key Points**:
  - Only you and your coach see these
  - Encrypted and private
  - Never shared publicly
  - Delete anytime
- **CTA**: I Understand button

### 3. Consent Toggle
- **Requirement**: Users must explicitly consent before proceeding
- **Text**: Clear description of data usage and rights
- **Enforcement**: Submit button disabled until consent checked

### 4. Anxiety-Lowering Tips
- **Fitted clothing**: Sports bra/shorts recommended
- **Environment**: Quiet spot with good lighting
- **Reassurance**: You can retake any photo, no judgment

### 5. Guided Capture (Front, Side, Back)
For each angle:
- **Semi-transparent silhouette overlay**: Shows body alignment guide
- **Video preview**: With real-time camera feed
- **Capture button**: Large, centered, gradient
- **Confirm/Retake**: After capture, review with options
- **Encouraging copy**: Context-specific instructions for each angle

### 6. Aftercare
- **Success state**: Checkmark with upload confirmation
- **Message**: "That Took Courage" + reassurance that baseline ≠ verdict
- **No body image**: CRITICAL — the captured photo is NOT shown back
- **Timeline**: "Come back in a few weeks to see what's changed"
- **CTA**: Back to Dashboard button

## Technical Implementation

### Upload Route
- Uses existing `/api/upload` endpoint for Vercel Blob storage
- Photos uploaded with timestamps in filenames
- Private blob storage (access: 'private')

### Database Schema (progress_photos table)
```
- id (uuid, primary key)
- client_id (uuid, references clients.id)
- front_photo (text, blob URL)
- side_photo (text, blob URL)
- back_photo (text, blob URL)
- week_number (integer)
- notes (text, nullable)
- upload_date (date, default today)
- created_at (timestamp, default now)
```

### Server Action: uploadProgressPhotos
- Converts Blob objects to FormData
- Uploads to Vercel Blob in parallel
- Saves metadata to progress_photos table
- Returns success/error with data or message
- Error handling shows inline with retry option

### Components
1. **ProgressPhotoFlow.tsx** (466 lines)
   - State management for all 6 screens
   - Orchestrates capture flow
   - Handles upload and error states

2. **PhotoCapture.tsx** (233 lines)
   - Real-time camera capture
   - Silhouette overlay SVG
   - Confirm/retake workflow
   - Instructions per angle

3. **upload-progress-photos.ts** (77 lines)
   - Server action for photo + metadata upload
   - Blob→FormData conversion
   - Parallel uploads, fallback to null

## Design System Alignment

- **Dark theme**: #090c14 background
- **Teal accents**: #2dd4bf (primary), #22c55e (secondary)
- **Typography**: 
  - Headings: Instrument Serif italic
  - Body: Satoshi regular
- **Components**: Glass cards, border 1px rgba(255,255,255,0.08)
- **Animations**: 
  - Framer Motion stagger, spring physics
  - Soft glow on interactive elements
  - No confetti or extreme celebration

## Key Privacy & Safety Features

✓ Explicit consent required  
✓ Privacy lock icon and messaging  
✓ Photos never displayed back to user (aftercare screen privacy)  
✓ RLS protects photos — only client + coach can access  
✓ Delete option available anytime  
✓ Blob storage is private by default  
✓ No screenshots/sharing features  

## Integration Points

- **Check-in flow**: Optional final step after submission reveal screen
- **Coach review**: Photos visible in `/app/coach` review screen
- **Client dashboard**: Photos stored but not displayed in main dashboard
- **Progress tracking**: Linked to week_number for temporal trending

## Error Handling

- Camera access denied → inline error message
- Network failure during upload → error card with retry button
- Upload timeout → fallback to dashboard with error toast
- Partial upload → all-or-nothing constraint (all 3 angles required)

## Future Enhancements

- Comparison slider between weeks
- Coach-provided guidance annotations
- Client-side blur toggle before upload
- Bulk re-upload if photos deleted
- Progress video timeline view
