# Grizzly Mats Driver Management App - Design Guidelines

## Design Approach

**Selected Framework**: Apple Human Interface Guidelines (iOS/iPadOS)
**Rationale**: The user explicitly requested "Apple-inspired design" for a mobile-optimized utility application. Apple's HIG emphasizes clarity, deference, and depth - perfect for a functional driver management tool that prioritizes usability and reliability.

**Core Principles**:
- Clarity: Content fills the screen with generous whitespace and legible typography
- Deference: UI elements defer to content, minimal chrome
- Depth: Subtle layers and motion provide hierarchy without distraction

---

## Typography System

**Font Family**: System font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif`)

**Hierarchy**:
- **Page Headers**: 32px/2rem, weight 700, tracking -0.02em
- **Section Headers**: 24px/1.5rem, weight 600, tracking -0.01em  
- **Card Titles**: 20px/1.25rem, weight 600
- **Body Large**: 17px/1.0625rem, weight 400 (primary interface text)
- **Body**: 15px/0.9375rem, weight 400 (secondary information)
- **Caption**: 13px/0.8125rem, weight 400, 85% opacity (metadata, timestamps)
- **Button Text**: 17px/1.0625rem, weight 600

**Line Height**: 1.5 for body text, 1.2 for headings

---

## Layout & Spacing System

**Spacing Scale**: Tailwind units of **2, 4, 6, 8, 12, 16, 24** (p-2, p-4, p-6, p-8, p-12, p-16, p-24)

**Mobile Layout (Driver View)**:
- Full-width interface with safe area insets
- Padding: px-4 (16px horizontal) for main content
- Card spacing: gap-4 between elements
- Bottom navigation/action bar: pb-8 for safe area

**Desktop Layout (Admin Dashboard)**:
- Max-width container: max-w-7xl mx-auto
- Sidebar width: 280px fixed
- Main content area: px-6 py-8
- Card grid spacing: gap-6

**Touch Targets**:
- Minimum height: 48px (h-12) for all interactive elements
- Primary action buttons: 56px (h-14) minimum on mobile
- Spacing between touch targets: minimum 8px

---

## Component Library

### Navigation

**Mobile Driver Navigation**:
- Fixed bottom tab bar with 2-3 items (Schedule, Time Clock, Profile)
- Height: 72px with safe area padding
- Icons: 24px with 10px label below
- Active state: full opacity, inactive: 60% opacity

**Admin Dashboard Navigation**:
- Fixed left sidebar: 280px wide, full height
- Logo/company name at top (py-6)
- Navigation items: py-3 px-4, rounded-lg on hover
- Section dividers with 12px vertical spacing

### Buttons

**Primary Button (CTA)**:
- Height: 56px on mobile, 48px on desktop
- Border radius: 12px (rounded-xl)
- Font weight: 600
- Full-width on mobile, min-width 200px on desktop
- Shadow: subtle elevation (shadow-sm)

**Secondary Button**:
- Same size as primary
- Border: 1.5px solid with 50% opacity
- Transparent background
- Border radius: 12px

**Clock In/Out Buttons** (Mobile):
- Extra large: 64px height (h-16)
- Full width with 16px horizontal padding
- Border radius: 16px (rounded-2xl)
- Icon + text combination (icon on left, 24px size)
- Haptic feedback on press (visual: scale-95 on active)

**Icon Buttons**:
- Size: 40px × 40px
- Border radius: 10px (rounded-lg)
- Icon size: 20px

### Cards & Containers

**Route Cards (Admin Dashboard)**:
- Background: white with 1px border
- Border radius: 16px (rounded-2xl)
- Padding: p-6
- Shadow: shadow-sm with subtle border
- Header with drag handle icon (24px, left-aligned)

**Schedule List Items (Driver Mobile)**:
- Background: white
- Padding: p-4
- Border radius: 12px (rounded-xl)
- Stop number badge: 32px circle, positioned left
- Divider between items: 1px line with 12px vertical margin

**Status Cards**:
- Compact height: py-4 px-5
- Border radius: 12px
- Border left accent: 4px width for status indication
- Icon + text horizontal layout

### Forms & Inputs

**Text Input Fields**:
- Height: 48px
- Border: 1.5px solid, 30% opacity
- Border radius: 10px (rounded-lg)
- Padding: px-4
- Focus state: border opacity 100%, subtle shadow
- Label above input: text-sm, mb-2

**File Upload (CSV)**:
- Drag-and-drop zone: min-height 200px
- Dashed border: 2px, border-dashed
- Border radius: 12px
- Upload icon: 48px, centered
- Helper text below icon

**Select/Dropdown**:
- Same specs as text input
- Chevron icon right-aligned (16px)
- Dropdown menu: rounded-xl, shadow-lg, py-2

### Data Display

**Route Overview Grid (Admin)**:
- 2-column layout on tablet (md:grid-cols-2)
- 3-column on desktop (lg:grid-cols-3)
- Gap: gap-6
- Each card shows: driver name, stop count, distance, estimated time

**Schedule List (Driver Mobile)**:
- Sequential numbered stops (1, 2, 3...)
- Address in body-large weight
- Customer name and service type in caption
- Chevron icon on right (16px)

**Time Entry Display**:
- Two-column grid for clock in/out info
- Timestamp: body weight
- Location name: caption
- GPS coordinates: caption, 70% opacity

### Maps & Geographic Elements

**Map Preview (Admin Dashboard)**:
- Aspect ratio: 16:9
- Border radius: 12px
- Embedded within route card at top
- Controls: minimal, positioned top-right

**"Open in Google Maps" Button (Mobile)**:
- Prominent positioning: top of schedule view
- Icon: maps pin (20px) + external link indicator
- Background: slight tint for elevation
- Sticky position when scrolling (optional enhancement)

### Drag & Drop Interface (Admin)

**Draggable Route Stop**:
- Drag handle: 6 horizontal lines icon, 20px, left-most
- Dragging state: lifted elevation (shadow-lg), 98% opacity
- Drop zone indicator: 2px dashed border, subtle highlight
- Smooth transitions: 150ms ease-out

---

## Responsive Breakpoints

- **Mobile**: < 768px (base, primary driver interface)
- **Tablet**: 768px - 1024px (md:)
- **Desktop**: > 1024px (lg:, admin dashboard optimal)

**Mobile-First Considerations**:
- Single column layouts stack vertically
- Bottom navigation for drivers
- Collapsible sections for space efficiency
- Large touch targets throughout

---

## Interaction States

**Button States**:
- Default: full opacity, subtle shadow
- Hover (desktop): 5% darker, shadow-md
- Active/Pressed: scale-95 transform, shadow-sm
- Disabled: 40% opacity, no shadow, cursor-not-allowed

**Card Hover (desktop)**:
- Subtle lift: translateY(-2px)
- Shadow enhancement: shadow-md
- Transition: 200ms ease-out

**No Animations**: Keep motion minimal - only use for meaningful state changes (drag/drop, loading states)

---

## Images

**No hero images required** - this is a utility application focused on functionality.

**Icon Usage**: Heroicons (outline for inactive states, solid for active states) via CDN
- Navigation icons: 24px
- Action button icons: 20px
- Status indicators: 16px

---

## Accessibility

- WCAG 2.1 AA compliance for all text
- Focus indicators: 2px outline, 4px offset on all interactive elements
- Semantic HTML throughout (proper heading hierarchy, ARIA labels)
- Touch targets: minimum 48×48px
- Form labels always visible (no placeholder-only inputs)
- Screen reader announcements for clock in/out success

---

## GPS & Location Features

**Location Permission Prompt**:
- Modal overlay with clear explanation
- Icon: location pin, 64px, centered
- Primary CTA: "Enable Location"
- Secondary link: "Why we need this"

**GPS Verification Display**:
- Success state: checkmark icon + "Location verified" message
- Error state: warning icon + "Outside work area" with distance indicator
- Circular radius visualization on map (100m geofence)