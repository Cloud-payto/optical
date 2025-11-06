# OptiProfit Spacing Guide

This guide documents the spacing conventions and design system used throughout the OptiProfit application.

## Table of Contents
- [Spacing Scale](#spacing-scale)
- [Common Patterns](#common-patterns)
- [Responsive Spacing](#responsive-spacing)
- [Component Guidelines](#component-guidelines)
- [Best Practices](#best-practices)
- [Spacing Constants](#spacing-constants)

## Spacing Scale

OptiProfit follows Tailwind CSS's spacing scale, which is based on a **4px base unit**.

### Base Scale
| Value | Tailwind Class | Pixels | Usage |
|-------|---------------|--------|-------|
| 0.5 | `2px` | `p-0.5, m-0.5` | Minimal spacing |
| 1 | `4px` | `p-1, m-1` | Tight spacing |
| 2 | `8px` | `p-2, m-2` | Small spacing |
| 3 | `12px` | `p-3, m-3` | Input padding |
| 4 | `16px` | `p-4, m-4` | Standard element spacing |
| 6 | `24px` | `p-6, m-6` | Card padding, loose spacing |
| 8 | `32px` | `p-8, m-8` | Section spacing, large containers |
| 12 | `48px` | `p-12, m-12` | Hero sections only |

## Common Patterns

### Page Layout
```html
<!-- Standard page wrapper -->
<div className="h-full bg-gray-50">
  <div className="p-6 md:p-8">
    <Container size="xl">
      <!-- Page content -->
    </Container>
  </div>
</div>
```

### Section Spacing
- **Standard sections**: `mb-8` (32px between major content blocks)
- **Hero sections**: `mb-12` (48px after hero sections only)
- **Subsections**: `mb-6` (24px between related content)
- **Elements**: `mb-4` (16px between form elements, paragraphs)

### Card Components
```html
<!-- Standard card -->
<div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="mb-4">Title</h3>
  <p className="mb-6">Content</p>
</div>

<!-- Large card -->
<div className="bg-white rounded-lg shadow-sm p-8">
  <!-- Content -->
</div>
```

## Responsive Spacing

### Responsive Padding Pattern
Our standard responsive padding pattern:
```css
p-6 md:p-8
```
- **Mobile**: 24px padding
- **Desktop (768px+)**: 32px padding

### Container Responsive Padding
For containers with responsive horizontal padding:
```css
px-4 sm:px-6 lg:px-8
```
- **Mobile**: 16px horizontal
- **Small (640px+)**: 24px horizontal  
- **Large (1024px+)**: 32px horizontal

### Grid Gaps
- **Standard grids**: `gap-4 md:gap-6` (16px → 24px)
- **Large grids**: `gap-6 md:gap-8` (24px → 32px)

## Component Guidelines

### Cards
- **Default padding**: `p-6` (24px)
- **Large cards**: `p-8` (32px)
- **Compact cards**: `p-4` (16px)
- **Card header**: `p-6` with `space-y-1.5` for internal elements

### Buttons
- **Small**: `px-3 py-1.5` (12px/6px)
- **Medium**: `px-4 py-2` (16px/8px)
- **Large**: `px-6 py-3` (24px/12px)

### Forms
- **Input padding**: `px-3 py-2` (12px/8px)
- **Large inputs**: `px-4 py-3` (16px/12px)
- **Form groups**: `space-y-4` (16px between fields)

### Navigation
- **Sidebar padding**: `p-4` (16px sections)
- **Nav items**: `px-3 py-2` (12px/8px)
- **Nav spacing**: `space-y-2` (8px between items)

## Best Practices

### ✅ Do
- Use the standardized spacing constants from `/src/constants/spacing.ts`
- Follow the responsive pattern `p-6 md:p-8` for page content
- Use `mb-8` for section spacing (not `mb-12` unless it's a hero section)
- Use Container component consistently across pages
- Maintain consistent grid gaps with `gap-4 md:gap-6`

### ❌ Don't
- Use arbitrary spacing values like `mb-7` or `p-5`
- Mix different section spacing patterns on the same page
- Use `mb-12` for regular sections (only for hero sections)
- Hardcode pixel values in CSS
- Skip responsive spacing considerations

### Grid Layout Guidelines
- **1 column mobile → 2 columns tablet → 3-4 columns desktop**
- Use progressive enhancement: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Consistent gap spacing with responsive scaling

### Visual Hierarchy
1. **Page sections**: 32px spacing (`mb-8`)
2. **Content groups**: 24px spacing (`mb-6`)
3. **Related elements**: 16px spacing (`mb-4`)
4. **Tight groupings**: 8px spacing (`mb-2`)

## Spacing Constants

Import spacing constants from `/src/constants/spacing.ts`:

```typescript
import { SPACING, RESPONSIVE_PADDING, SPACING_COMBOS } from '../constants/spacing';

// Usage examples
<div className={SPACING.section}> // mb-8
<div className={SPACING.container}> // p-6 md:p-8
<div className={SPACING_COMBOS.pageWrapper}> // h-full bg-gray-50
```

### Available Constants

#### SPACING
- `section`: `mb-8` - Standard section spacing
- `sectionLarge`: `mb-12` - Hero sections only  
- `container`: `p-6 md:p-8` - Standard container padding
- `card`: `p-6` - Standard card padding
- `element`: `mb-4` - Between related elements

#### RESPONSIVE_PADDING
- `page`: `p-6 md:p-8` - Standard page padding
- `container`: `px-4 sm:px-6 lg:px-8` - Container horizontal padding
- `button`: `px-4 py-2` - Standard button padding

#### SPACING_COMBOS
- `pageWrapper`: `h-full bg-gray-50` - Standard page wrapper
- `cardContainer`: `p-6 rounded-lg shadow-sm` - Standard card styling

## Migration Notes

When updating existing components:

1. **Replace hardcoded spacing** with utility classes
2. **Standardize section spacing** to `mb-8` (except hero sections)
3. **Use Container component** instead of custom max-width containers
4. **Apply responsive padding patterns** consistently
5. **Import and use spacing constants** for maintainability

## Examples

### Page Structure
```tsx
// ✅ Correct page structure
const MyPage = () => (
  <div className={SPACING_COMBOS.pageWrapper}>
    <div className={SPACING.container}>
      <Container size="xl">
        <h1 className={SPACING.element}>Page Title</h1>
        
        <section className={SPACING.section}>
          <h2 className={SPACING.element}>Section Title</h2>
          <p className={SPACING.elementSmall}>Content</p>
        </section>
        
        <section className={SPACING.section}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={SPACING.card}>
              <h3 className={SPACING.elementSmall}>Card Title</h3>
              <p>Card content</p>
            </Card>
          </div>
        </section>
      </Container>
    </div>
  </div>
);
```

### Component Spacing
```tsx
// ✅ Proper component spacing
const FeatureCard = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-semibold mb-2">Feature Title</h3>
    <p className="text-gray-600 mb-4">Feature description</p>
    <Button className="w-full">Learn More</Button>
  </div>
);
```

This spacing guide ensures consistency across the OptiProfit application and provides clear guidelines for maintaining the design system as the application grows.