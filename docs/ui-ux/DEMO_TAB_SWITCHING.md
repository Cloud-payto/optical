# Demo Tab Switching Implementation

## 🎯 Overview

The OptiProfit demo now automatically switches between the "Single Profit Calculator" and "Profit Comparison" tabs as users progress through the demo steps.

## ✅ Implementation Details

### 1. **CalculatorPage Updates**

Added demo context and automatic tab switching logic:

```typescript
const CalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison'>('calculator');
  const { isDemo, currentStepData } = useDemo();

  // Switch to comparison tab when demo reaches comparison steps
  useEffect(() => {
    if (isDemo && currentStepData) {
      // Check if we're on a comparison demo step
      if (currentStepData.id === 'comparison-intro' || 
          currentStepData.id === 'comparison-overview' || 
          currentStepData.id === 'comparison-results') {
        setActiveTab('comparison');
      }
      // Switch back to calculator for calculator-specific steps
      else if (currentStepData.page === '/calculator' && 
               !currentStepData.id.includes('comparison')) {
        setActiveTab('calculator');
      }
    }
  }, [isDemo, currentStepData]);
```

### 2. **Demo Flow Behavior**

The tab switching now works as follows:

1. **Steps 1-10**: Calculator tab is active
   - Users learn about single frame profit calculations
   - Tab remains on "Single Profit Calculator"

2. **Step 11**: Switches to Comparison tab
   - When "comparison-intro" step begins
   - Highlights the "Profit Comparison" button
   - Automatically switches to show comparison interface

3. **Steps 12-13**: Remains on Comparison tab
   - Shows pre-filled demo data for comparison
   - Demonstrates the comparison results

4. **Step 14+**: Moves to Dashboard
   - Continues with the rest of the demo flow

### 3. **Pre-filled Demo Data**

When the demo reaches the comparison overview step, it automatically fills in example data:

**Frame 1 (Ray-Ban Aviator)**:
- Brand: Luxottica
- Your Cost: $15
- Wholesale: $150
- Tariff Tax: $6
- Retail Price: $375 (2.5x multiplier)

**Frame 2 (Carrera Sport)**:
- Brand: Safilo
- Your Cost: $16
- Wholesale: $160
- Tariff Tax: $6.40
- Retail Price: $400 (2.5x multiplier)

This gives users a realistic comparison showing:
- Carrera Sport generates $25 more in retail price
- But costs $1 more in actual cost
- The comparison will calculate which is truly more profitable

## 🎨 User Experience

1. **Seamless Transition**: Tab switches automatically without user intervention
2. **Visual Feedback**: Active tab is highlighted in blue
3. **Context Preservation**: If user manually switches tabs during demo, it respects the demo flow
4. **Pre-filled Data**: No need for users to enter data during demo - they can focus on understanding the feature

## 🔧 Technical Benefits

- **No Breaking Changes**: Manual tab switching still works normally outside of demo
- **Clean Implementation**: Uses React hooks for state management
- **Performance**: Only runs logic when in demo mode
- **Maintainable**: Clear conditions for when to switch tabs

## 📋 Demo Step Mapping

| Step | Tab | Description |
|------|-----|-------------|
| 1-10 | Calculator | Single profit calculation steps |
| 11 | Comparison | Introduction to comparison feature (auto-switch) |
| 12 | Comparison | Overview of comparison tool with demo data |
| 13 | Comparison | Results display showing winner |
| 14+ | N/A | Continues to Dashboard |

The implementation ensures users see all features of OptiProfit in a logical flow, automatically navigating them through the interface as the demo progresses!