# Calendar App Design Guidelines

## General Design Principles

* Use clean, modern design with plenty of white space
* Prioritize readability and accessibility
* Use consistent spacing and typography throughout
* Implement responsive design that works on mobile and desktop
* Use subtle shadows and rounded corners for depth
* Keep color palette minimal and purposeful

## Layout Guidelines

* Use CSS Grid for main layout structure (calendar + sidebar)
* Use Flexbox for component internal layouts
* Maintain consistent padding: 4-6 units for containers, 2-3 for components
* Responsive breakpoints: mobile-first approach with lg: breakpoint for desktop
* Maximum container width: 7xl (80rem) centered with mx-auto

## Color System

* Primary brand color: Green-700 for accents and icons
* Background: Clean white/light gray (gray-50)
* Text hierarchy: gray-800 for headings, gray-600 for secondary text
* Event colors: Use vibrant but accessible colors (blue, green, purple, orange, red)
* Hover states: Use opacity or lighter shades
* Focus states: Use ring utilities for accessibility

## Typography

* Headings: Use text-4xl for main title, text-xl for section headers
* Body text: Default size with good line height
* Font weight: Medium (500) for emphasis, normal (400) for body
* Use system fonts for performance and consistency

## Components

### Calendar Grid
* Clean grid layout with subtle borders
* Hover effects on interactive dates
* Clear visual distinction between current month and adjacent months
* Event indicators should be small, colorful dots or badges

### Cards and Containers
* Use subtle shadows (shadow-sm to shadow-md)
* Rounded corners (rounded-lg)
* White background with subtle borders
* Consistent padding (p-4 to p-6)

### Buttons
* Primary: Solid background with hover effects
* Secondary: Outlined style
* Icon buttons: Square with subtle hover background
* Use consistent sizing (h-9 for default, h-8 for small)

### Forms and Inputs
* Clean, minimal styling
* Focus states with ring utilities
* Proper spacing between form elements
* Clear labels and placeholders

## Interactive States

* Hover: Subtle background color changes or opacity
* Focus: Clear ring indicators for accessibility
* Active: Slightly darker or pressed appearance
* Disabled: Reduced opacity and no pointer events

## Spacing System

* Use Tailwind's spacing scale consistently
* Container padding: p-4 on mobile, p-8 on desktop
* Component margins: mb-4 to mb-8 for sections
* Internal padding: p-3 to p-6 depending on component size

## Accessibility

* Ensure proper color contrast ratios
* Use semantic HTML elements
* Provide focus indicators for keyboard navigation
* Include proper ARIA labels where needed
* Ensure touch targets are at least 44px for mobile