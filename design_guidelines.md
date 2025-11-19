# Boardroom Booking Admin Dashboard - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Material Design + Linear-inspired)

This admin dashboard requires clarity, efficiency, and data density. Drawing from Material Design's structured approach combined with Linear's clean, modern aesthetic for optimal admin experience.

**Key Principles:**
- Information clarity over visual flair
- Efficient data scanning and interaction
- Professional, modern admin aesthetic
- Purposeful use of space for dense information

## Typography

**Font Family:** Inter (via Google Fonts CDN)
- Primary: Inter 400 (body), 500 (labels), 600 (headings)

**Hierarchy:**
- Page Title: text-2xl font-semibold
- Section Headers: text-lg font-semibold
- Tab Labels: text-sm font-medium
- Card Titles/User Names: text-base font-medium
- Body/Details: text-sm font-normal
- Labels/Meta: text-xs font-medium uppercase tracking-wide

## Layout System

**Spacing Units:** Consistent use of 4, 6, 8, 12, 16, 24 (Tailwind units)
- Component padding: p-6 to p-8
- Card spacing: space-y-4
- Section gaps: gap-6 to gap-8
- Page margins: px-8 py-6

**Container Strategy:**
- Dashboard wrapper: max-w-[1600px] mx-auto
- Sidebar (if added): w-64 fixed
- Main content: Full width with internal max-width constraints

## Component Library

### Dashboard Header
- Height: h-16
- Includes: Logo/title (left), breadcrumbs (center), user profile (right)
- Border: border-b with subtle shadow

### FullCalendar Timeline
- Height: min-h-[600px]
- Custom styling to match overall design system
- Resource rows with clear visual separation
- Time slots with hover states
- Booking blocks with user info on hover
- Clean grid lines and professional color coding

### Tabbed Interface
- Tab container: border-b
- Individual tabs: px-6 py-3 with bottom border indicator for active state
- Active tab: border-b-2 with accent indicator
- Smooth transition between views

### Booking Cards (Latest Bookings View)
- Card container: rounded-lg border with hover:shadow-md transition
- Layout: Grid display (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
- Card padding: p-6
- Structure per card:
  - Header: User name (text-base font-medium) + time badge (top right)
  - Details grid (2 columns):
    - Email with icon
    - Cell number with icon
  - Footer: Action buttons (Edit, Delete)

### All Bookings View (Table)
- Table wrapper: rounded-lg border overflow-hidden
- Header: sticky top-0 with background
- Columns: User, Email, Cell, Date/Time, Duration, Actions
- Row height: h-14
- Hover state: row background change
- Sortable headers with icons

### Popup Modal
- Overlay: backdrop blur and semi-transparent background
- Modal: max-w-md centered with rounded-xl shadow-2xl
- Modal padding: p-8
- Structure:
  - Header: Title + close button (text-xl font-semibold)
  - Body: Date/time picker, user info display/edit
  - Footer: Action buttons (Cancel, Save)

### Date/Time Picker
- Integrated calendar view component
- Time selector with dropdown or input
- Clear visual feedback for selected dates
- "Today" quick action button

### Buttons
- Primary: px-4 py-2 rounded-md font-medium
- Secondary: outlined variant
- Icon buttons: square (w-8 h-8) for actions
- Danger variant for delete actions

### Status Badges
- Small rounded-full or rounded-md pills
- Padding: px-3 py-1 text-xs font-medium
- Used for time indicators, status labels

## Icons

**Library:** Heroicons (outline and solid variants via CDN)
- Navigation: Calendar, Clock, User, Phone, Mail
- Actions: Pencil (edit), Trash (delete), Plus (add), X (close)
- UI: ChevronDown (dropdowns), Check (confirmations)

## Navigation & Information Architecture

### Main Dashboard Layout
- Left sidebar (optional): Quick navigation, filters
- Top bar: Dashboard title, date selector, "Add Booking" CTA
- Main content area: Calendar view (default) + Tabs below

### Content Hierarchy
1. Calendar Timeline (primary view) - prominently displayed
2. Tabs section immediately below
3. Booking list/cards based on active tab

## Interactions & States

**Hover States:**
- Cards: subtle shadow elevation
- Table rows: background color change
- Buttons: slight opacity or background change
- Calendar slots: highlight on hover

**Active States:**
- Selected tab: border accent + font weight
- Selected date: distinct background
- Focused inputs: border accent + ring

**Loading States:**
- Skeleton screens for booking cards
- Spinner for modal actions
- Disabled button states during operations

## Responsive Behavior

**Desktop (lg+):**
- 3-column booking card grid
- Full calendar timeline with all resources visible
- Sidebar visible (if implemented)

**Tablet (md):**
- 2-column booking card grid
- Scrollable calendar timeline
- Condensed spacing (p-6 → p-4)

**Mobile (base):**
- Single-column stacked layout
- List view prioritized over calendar
- Hamburger menu for navigation
- Modal takes full screen height

## Admin-Specific Enhancements

- Bulk action toolbar (when items selected)
- Quick filters for date ranges, users, boardrooms
- Export functionality button (CSV/PDF)
- Search bar for finding specific bookings
- Notification badge for conflicts or pending approvals

## No Hero Section
This is an admin dashboard - no marketing hero needed. Lead directly with functional dashboard header and calendar view.