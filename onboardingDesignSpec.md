# Verbalist Onboarding Design Specification

## Overview
This document provides complete specifications for implementing the Verbalist onboarding flow in React Native. The design features three distinct screens, each with its own color theme, flowing seamlessly through the user's first experience.

---

## Design Philosophy

**Key Principles:**
- **Elegant simplicity**: Clean, serif typography with ample whitespace
- **Subtle animations**: Smooth, purposeful motion that guides attention
- **Theme-driven**: Each screen has a distinct color palette (Lapis, Obsidian, Porcelain)
- **Message-style learning**: Feature descriptions appear as chat bubbles, previewing the app's core interaction
- **No emojis**: Professional, refined aesthetic without decorative icons

---

## Color Palettes

### Lapis Theme (Welcome Screen - Screen 01)
```
Rapture's Light:    #F6F3E7  (Background primary)
Milk Tooth:         #FAEBD7  (Background secondary)
Caramel Essence:    #E3AF64  (Accent primary)
Sapphire Dust:      #516AC8  (Accent secondary)
Blue Oblivion:      #26428B  (Accent tertiary)
Cosmic Odyssey:     #0F1939  (Text dark)
```

**Usage:**
- Background: Rapture's Light
- Message bubbles: White with Caramel Essence left border
- Text: Cosmic Odyssey (primary), Blue Oblivion (secondary)
- Button: Blue Oblivion background
- Version tag: Sapphire Dust

### Obsidian Theme (Word List Selection - Screen 02)
```
Black Howl:         #202030  (Background primary)
Shani Purple:       #4C1050  (Background secondary)
Cherry Foam:        #F392A0  (Accent primary)
Purple Cabbage:     #3D34A5  (Accent secondary)
Snow Drift:         #E3E3DC  (Text light)
Moonwalk:           #BEBEC4  (Text muted)
```

**Usage:**
- Background: Black Howl
- Card backgrounds: rgba(255, 255, 255, 0.05)
- Custom card: Shani Purple
- Accent border on hover: Cherry Foam
- Badge background: rgba(243, 146, 160, 0.2)
- Text: Snow Drift (primary), Moonwalk (secondary)

### Porcelain Theme (Custom Word List - Screen 03)
```
Unbleached:         #FBFAF5  (Background primary)
Cameo Stone:        #EBDFD8  (Background secondary)
Pretty Posie:       #BCBDE4  (Accent primary)
Cream and Butter:   #FEEEA5  (Accent secondary)
Safari Green:       #6C6D2F  (Accent tertiary)
MSU Green:          #18453B  (Text dark)
```

**Usage:**
- Background: Unbleached
- Input background: White
- Input border: Cameo Stone
- Progress bar: Gradient from Safari Green to Pretty Posie
- Pills: Pretty Posie background
- Button: Safari Green
- Text: MSU Green

---

## Typography

### Fonts Required
1. **Crimson Pro** (Body/UI text)
   - Light (300)
   - Regular (400)
   - SemiBold (600)

2. **DM Serif Display** (Display/Headings)
   - Regular (400)

### Type Scale
```
Display Large:  56px  (Logo on Screen 01)
Heading 1:      42px  (Screen titles)
Heading 2:      20px  (Feature titles in messages)
Body Large:     18px  (CTA buttons)
Body:           16px  (Subtitles, input text)
Body Small:     14px  (Message descriptions, pill text)
Caption:        13px  (Progress text, word count badges)
Label:          14px  (Screen numbers)
Version:        13px  (Beta tag)
```

### Font Weights
- Logo: Regular (DM Serif Display)
- Headings: Regular (DM Serif Display)
- Body: Regular (Crimson Pro)
- Labels/Tags: SemiBold (Crimson Pro - 600)
- Buttons: Regular (DM Serif Display)

---

## Screen 01: Welcome (Lapis Theme)

### Layout Structure
```
┌─────────────────────────────────────┐
│                               01    │ ← Screen number (top right)
│                                     │
│  Verbalist                          │ ← Logo (56px DM Serif)
│  v1.0.0 — Beta                      │ ← Version tag
│                                     │
│  Learn vocabulary through real      │ ← Tagline (20px)
│  conversation. No flashcards.       │
│  No drills. Just talk.              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Natural Dialogue            │   │ ← Message bubble 1
│  │ Chat with AI that uses...   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Spaced Repetition           │   │ ← Message bubble 2
│  │ Words reappear exactly...   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Contextual Learning         │   │ ← Message bubble 3
│  │ Master not just...          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Begin Your Journey        │   │ ← CTA button
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Element Specifications

**Screen Number**
- Position: Absolute top-right (60px from top, 40px from right)
- Text: "01"
- Font: Crimson Pro SemiBold, 14px
- Color: Sapphire Dust (#516AC8)
- Opacity: 0.4
- Letter spacing: 0.2em

**Logo Section**
- Margin bottom: 50px
- Logo text: "Verbalist"
  - Font: DM Serif Display Regular, 56px
  - Color: Cosmic Odyssey (#0F1939)
  - Letter spacing: -0.02em
- Version tag: "v1.0.0 — Beta"
  - Font: Crimson Pro SemiBold, 13px
  - Color: Sapphire Dust (#516AC8)
  - Opacity: 0.6
  - Letter spacing: 0.1em
  - Margin top: 6px

**Tagline**
- Font: Crimson Pro Regular, 20px
- Line height: 1.5 (30px)
- Color: Blue Oblivion (#26428B)
- Margin bottom: 40px

**Message Bubbles** (3 total)
- Container: Flex column, gap 16px
- Each bubble:
  - Background: White
  - Padding: 18px horizontal, 22px vertical
  - Border radius: 20px
  - Border left: 4px solid Caramel Essence (#E3AF64)
  - Shadow: 0px 4px 12px rgba(15, 25, 57, 0.08)
  
- Message title:
  - Font: DM Serif Display Regular, 17px
  - Color: Cosmic Odyssey (#0F1939)
  - Margin bottom: 6px
  
- Message text:
  - Font: Crimson Pro Regular, 14px
  - Line height: 1.5 (21px)
  - Color: Blue Oblivion (#26428B)
  - Opacity: 0.9

**Message Content:**
1. Title: "Natural Dialogue"
   Text: "Chat with AI that uses your target words organically, like texting a well-read friend"

2. Title: "Spaced Repetition"
   Text: "Words reappear exactly when you need to review them, building lasting retention"

3. Title: "Contextual Learning"
   Text: "Master not just definitions, but usage, connotation, and real-world application"

**CTA Button**
- Width: 100%
- Padding: 20px vertical
- Background: Blue Oblivion (#26428B)
- Border radius: 30px
- Font: DM Serif Display Regular, 18px
- Color: White
- Text: "Begin Your Journey"
- Shadow: 0px 4px 16px rgba(38, 66, 139, 0.2)

### Animations

**On Mount:**
1. Screen number: Fade in (0.8s ease-out)
2. Logo section: Fade in + slide down (0.8s ease-out)
3. Tagline: Fade in + slide up (0.8s ease-out, delay 0.3s)
4. Message bubble 1: Slide in from left (0.6s ease-out, delay 0.5s)
5. Message bubble 2: Slide in from left (0.6s ease-out, delay 0.7s)
6. Message bubble 3: Slide in from left (0.6s ease-out, delay 0.9s)
7. CTA button: Fade in + slide up (0.8s ease-out, delay 1.1s)

**Slide in from left animation:**
- Start: translateX(-30px), opacity 0
- End: translateX(0), opacity 1

**Button Interaction:**
- On press: Scale to 0.98, duration 100ms
- On release: Scale to 1.0, duration 100ms
- On press (alternate): translateY(0px) → translateY(-2px) with shadow increase

---

## Screen 02: Word List Selection (Obsidian Theme)

### Layout Structure
```
┌─────────────────────────────────────┐
│                               02    │ ← Screen number
│                                     │
│  Select Word List                   │ ← Title (42px)
│  Choose preset or create custom     │ ← Subtitle
│                                     │
│  ┌───────────┐  ┌───────────┐      │
│  │ General   │  │ Literary  │      │ ← Grid row 1
│  │ High-Level│  │ & Rhetor. │      │
│  │           │  │           │      │
│  │ 50 words  │  │ 50 words  │      │
│  └───────────┘  └───────────┘      │
│                                     │
│  ┌───────────┐  ┌───────────┐      │
│  │ Politics  │  │ Create    │      │ ← Grid row 2
│  │ & Public  │  │ Custom    │      │
│  │           │  │           │      │
│  │ 50 words  │  │ Custom    │      │
│  └───────────┘  └───────────┘      │
│                                     │
│  (Custom spans full width)          │
└─────────────────────────────────────┘
```

### Element Specifications

**Screen Number**
- Same as Screen 01 but color: Cherry Foam (#F392A0)

**Header**
- Title: "Select Word List"
  - Font: DM Serif Display Regular, 42px
  - Color: Snow Drift (#E3E3DC)
  - Letter spacing: -0.01em
  - Margin bottom: 8px
- Subtitle: "Choose preset or create custom"
  - Font: Crimson Pro Light, 16px
  - Color: Moonwalk (#BEBEC4)

**Grid Layout**
- Display: Grid
- Columns: 2 (equal width with 16px gap)
- Gap: 16px
- Custom card spans both columns (grid-column: 1 / -1)

**List Card** (Standard - 3 preset cards)
- Background: rgba(255, 255, 255, 0.05)
- Border: 1px solid rgba(227, 227, 220, 0.1)
- Border radius: 20px
- Padding: 24px
- Position: Relative
- Overflow: Hidden

- Top border (on hover):
  - Position: Absolute top
  - Height: 3px
  - Background: Cherry Foam (#F392A0)
  - Transform: scaleX(0) → scaleX(1) on hover
  - Transition: 0.3s ease

- Card title:
  - Font: DM Serif Display Regular, 18px
  - Color: Snow Drift (#E3E3DC)
  - Margin bottom: 8px

- Card description:
  - Font: Crimson Pro Regular, 13px
  - Color: Moonwalk (#BEBEC4)
  - Line height: 1.4 (18px)
  - Margin bottom: 14px

- Word count badge:
  - Background: rgba(243, 146, 160, 0.2)
  - Color: Cherry Foam (#F392A0)
  - Padding: 6px horizontal, 14px vertical
  - Border radius: 20px
  - Font: Crimson Pro SemiBold, 11px
  - Letter spacing: 0.05em
  - Text transform: Uppercase

**List Card** (Custom - 4th card)
- Same as standard but:
  - Grid column: 1 / -1 (full width)
  - Background: Shani Purple (#4C1050)
  - Border: 1px solid Purple Cabbage (#3D34A5)
- Hover background: #5d1463

**Card Hover Effects**
- Transform: translateY(-4px)
- Background: rgba(255, 255, 255, 0.08)
- Shadow: 0px 8px 24px rgba(243, 146, 160, 0.2)
- Transition: All 0.3s ease

**Card Content:**

1. **General High-Level**
   - Title: "General High-Level"
   - Description: "Sophisticated vocabulary for everyday eloquence and professional discourse"
   - Badge: "50 words"

2. **Literary & Rhetorical**
   - Title: "Literary & Rhetorical"
   - Description: "The language of literature, criticism, and persuasive expression"
   - Badge: "50 words"

3. **Politics & Public Life**
   - Title: "Politics & Public Life"
   - Description: "Navigate discourse on governance, policy, and civic engagement"
   - Badge: "50 words"

4. **Create Custom List**
   - Title: "Create Custom List"
   - Description: "Build your own vocabulary collection from any source"
   - Badge: "Custom"

### Animations

**On Mount:**
1. Screen number: Fade in (0.6s ease-out)
2. Header: Fade in + slide down (0.6s ease-out)
3. Card 1: Scale in (0.5s ease-out, delay 0.1s)
4. Card 2: Scale in (0.5s ease-out, delay 0.2s)
5. Card 3: Scale in (0.5s ease-out, delay 0.3s)
6. Card 4 (custom): Scale in (0.5s ease-out, delay 0.4s)

**Scale in animation:**
- Start: opacity 0, scale(0.95)
- End: opacity 1, scale(1)

---

## Screen 03: Custom Word List (Porcelain Theme)

### Layout Structure
```
┌─────────────────────────────────────┐
│                               03    │ ← Screen number
│                                     │
│  ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░   │ ← Progress bar
│  7 more words needed                │ ← Progress text
│                                     │
│  Your Collection                    │ ← Title
│  Paste or type words to create...   │ ← Subtitle
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  [Text input area]          │   │ ← Multi-line textarea
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [pill] [pill] [pill] [pill]...    │ ← Word pills
│                                     │
│  13 / 20 words minimum              │ ← Counter
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Start Learning          │   │ ← CTA button
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Element Specifications

**Screen Number**
- Same as Screen 01/02 but color: Safari Green (#6C6D2F)

**Progress Container**
- Margin bottom: 30px

**Progress Bar**
- Height: 6px
- Background: Cameo Stone (#EBDFD8)
- Border radius: 10px
- Overflow: Hidden
- Margin bottom: 10px

**Progress Fill**
- Height: 100%
- Background: Linear gradient 90deg from Safari Green (#6C6D2F) to Pretty Posie (#BCBDE4)
- Border radius: 10px
- Width: Dynamic (0-100% based on word count / 20)
- Transition: Width 0.5s cubic-bezier(0.4, 0, 0.2, 1)

**Progress Text**
- Font: Crimson Pro Medium, 13px
- Color: Safari Green (#6C6D2F)
- Dynamic content:
  - If words.length < 20: "{20 - words.length} more word(s) needed"
  - If words.length >= 20: "Ready to begin!"

**Header**
- Title: "Your Collection"
  - Font: DM Serif Display Regular, 42px
  - Color: MSU Green (#18453B)
  - Letter spacing: -0.01em
  - Margin bottom: 8px
- Subtitle: "Paste or type words to create your personalized learning list"
  - Font: Crimson Pro Regular, 16px
  - Color: Safari Green (#6C6D2F)
  - Opacity: 0.8
  - Line height: 1.5 (24px)

**Text Input (Textarea)**
- Flex: 1 (takes available space)
- Background: White
- Border: 2px solid Cameo Stone (#EBDFD8)
- Border radius: 20px
- Padding: 20px
- Font: Crimson Pro Regular, 16px
- Color: MSU Green (#18453B)
- Placeholder color: Safari Green (#6C6D2F) at 40% opacity
- Placeholder text: "ecclesiastical, magnanimous, ephemeral, ubiquitous, perfunctory..."
- Margin bottom: 20px
- Text align: Top
- Multiline: True
- No resize

**Focus State:**
- Border color: Pretty Posie (#BCBDE4)
- Shadow: 0px 0px 0px 3px rgba(188, 189, 228, 0.2)
- Transition: All 0.3s ease

**Word Pills Container**
- Display: Flex
- Flex wrap: Wrap
- Gap: 10px
- Min height: 60px
- Margin bottom: 20px
- Horizontal scroll: If needed (mobile)

**Individual Pill**
- Background: Pretty Posie (#BCBDE4)
- Color: White
- Padding: 10px horizontal, 18px vertical
- Border radius: 20px
- Font: Crimson Pro Medium, 14px
- Display: Inline flex
- Align items: Center
- Gap: 8px
- Shadow: 0px 2px 8px rgba(188, 189, 228, 0.3)

**Pill Remove Button**
- Text: "×"
- Font size: 16px
- Opacity: 0.7
- Cursor: Pointer
- Hover opacity: 1.0
- Transition: 0.2s

**Overflow Pill** (when > 15 words)
- Same styling but:
  - Opacity: 0.7
  - No remove button
  - Text: "+{count} more"
  - Not interactive

**Counter**
- Font: Crimson Pro Medium, 15px
- Color: Safari Green (#6C6D2F)
- Text align: Center
- Margin bottom: 20px
- Strong number:
  - Font: Crimson Pro SemiBold, 20px
  - Color: Safari Green (#6C6D2F)

**CTA Button**
- Same as Screen 01 but:
  - Background: Safari Green (#6C6D2F)
  - Shadow: 0px 4px 16px rgba(108, 109, 47, 0.2)
  - Text: "Start Learning"

**Disabled State** (when words.length < 20):
- Opacity: 0.5
- Cursor: Not allowed
- No hover effects

### Word Parsing Logic

**Input Processing:**
1. Take text input value
2. Convert to lowercase
3. Split by: whitespace, commas, semicolons, newlines (`/[\s,;\n]+/`)
4. Trim each word
5. Filter: length > 0 and matches pattern `/^[a-z-]+$/` (letters and hyphens only)
6. Remove duplicates (use Set)
7. Update words array

**Real-time Updates:**
- On every keystroke in textarea:
  - Parse words
  - Update word pills
  - Update counter
  - Update progress bar
  - Update button state

### Animations

**On Mount:**
1. Screen number: Fade in (0.6s ease-out)
2. Progress container: Fade in (0.6s ease-out)
3. Header: Fade in + slide down (0.6s ease-out)
4. Textarea: Fade in + slide up (0.6s ease-out, delay 0.3s)
5. Pills container: Fade in + slide up (0.6s ease-out, delay 0.4s)
6. Counter: Fade in (0.6s ease-out, delay 0.5s)
7. Button: Fade in + slide up (0.6s ease-out, delay 0.6s)

**Pill Animation** (on word add):
- Each pill: Pop in (0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55))
- Stagger delay: index * 50ms
- Start: scale(0), opacity 0
- End: scale(1), opacity 1

**Pill Removal:**
- Animate: scale(0) over 200ms
- Remove from DOM after animation

**Progress Bar Fill:**
- Animate width change: 0.5s cubic-bezier(0.4, 0, 0.2, 1)

**Button State Change:**
- Opacity change: 0.3s ease
- No abrupt jumps

---

## Navigation Flow

1. **Screen 01 → Screen 02:** User taps "Begin Your Journey"
2. **Screen 02 → Screen 03:** User taps "Create Custom List" card
3. **Screen 02 → (Next flow):** User taps any preset card (goes to next screen in actual app, not shown in mockup)
4. **Screen 03 → (Next flow):** User taps "Start Learning" when words.length >= 20

---

## Responsive Considerations

**Mobile (default - 430px width):**
- All padding: 40px horizontal
- Font sizes as specified

**Smaller devices (<375px):**
- Reduce horizontal padding to 30px
- Reduce logo size to 48px
- Reduce title sizes by ~10%
- Adjust grid to single column if needed

**Larger devices (>600px):**
- Center content with max-width constraint
- Maintain mobile-first design aesthetic

---

## Accessibility Requirements

1. **Color Contrast:**
   - All text meets WCAG AA standards
   - Minimum contrast ratio 4.5:1 for body text
   - Minimum contrast ratio 3:1 for large text

2. **Touch Targets:**
   - Minimum 44x44px for all interactive elements
   - Pills have adequate spacing (10px gap)

3. **Focus States:**
   - Visible focus indicators on all interactive elements
   - Keyboard navigation support

4. **Screen Readers:**
   - Proper heading hierarchy (h1 for screen titles)
   - Descriptive button labels
   - Progress bar has accessible label

---

## Implementation Notes for Engineering

### React Native Specific

1. **Fonts:**
   - Use `expo-font` to load Crimson Pro and DM Serif Display
   - Include weights: 300, 400, 600 for Crimson Pro
   - Include weight: 400 for DM Serif Display

2. **Animations:**
   - Use `Animated` API from React Native
   - Use `useRef` for animation values
   - Implement `useEffect` for on-mount animations
   - Use `Animated.sequence()` and `Animated.parallel()` for complex animations

3. **Layout:**
   - Use `flexbox` for all layouts
   - Use `StyleSheet.create()` for styles
   - Absolute positioning for screen number
   - ScrollView for word pills if overflow

4. **Inputs:**
   - TextInput with `multiline={true}` for textarea
   - `textAlignVertical="top"` for textarea
   - debounce word parsing if performance issues

5. **State Management:**
   - Local state for word array
   - Computed values for progress percentage
   - Boolean for button enabled state

6. **Theme Implementation:**
   - Create theme constants file with all three palettes
   - Pass theme as prop or use Context
   - Conditional styling based on active theme

### Component Structure Suggestion

```
WelcomeScreen/
  - MessageBubble component
  - Logo section
  - CTA button

WordListSelectionScreen/
  - ListCard component
  - Grid layout container

CustomWordListScreen/
  - ProgressBar component
  - WordPill component
  - TextInput with parsing logic
```

### Testing Checklist

- [ ] All animations run smoothly at 60fps
- [ ] Word parsing handles edge cases (special chars, numbers)
- [ ] Progress bar updates correctly
- [ ] Button state changes appropriately
- [ ] Hover/press states work on all interactive elements
- [ ] Screen transitions are smooth
- [ ] Fonts load before content renders (splash screen)
- [ ] Works on both iOS and Android
- [ ] Works on various screen sizes

---

## Assets Required

1. **Fonts:**
   - CrimsonPro-Light.ttf
   - CrimsonPro-Regular.ttf
   - CrimsonPro-SemiBold.ttf
   - DMSerifDisplay-Regular.ttf

2. **No images/icons required** - Pure text-based design

---

## Final Notes

- The design intentionally avoids emojis and icons for a clean, professional aesthetic
- Message bubbles on Screen 01 preview the app's chat interface
- Each screen uses a distinct theme to create visual progression
- Animations are subtle and purposeful, not distracting
- The grid layout on Screen 02 scales well and clearly differentiates the custom option
- Word pills provide immediate visual feedback on Screen 03
- All interactions feel responsive and natural

This design balances elegance with functionality, creating an onboarding experience that sets the tone for a sophisticated vocabulary learning app.