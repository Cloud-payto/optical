# Clean/Audit Codebase Command

## Purpose
Perform a comprehensive audit of the codebase to identify and remove unused code, dead imports, duplicate logic, and other cleanup opportunities.

## Usage
```
/clean [mode] [scope]
```

**Modes:**
- `audit` (default) - Report issues without making changes
- `auto` - Automatically fix safe issues
- `interactive` - Ask before each change
- `aggressive` - Remove all detected unused code (use with caution)

**Scope:**
- `all` (default) - Entire codebase
- `frontend` - React/TypeScript frontend only
- `backend` - Node.js/Express backend only
- `[specific-path]` - Specific directory or file

## What This Command Detects

### 1. Unused Code
- **Unused imports**: Import statements that are never used
- **Unused variables**: Declared but never referenced
- **Unused functions**: Defined but never called
- **Dead exports**: Exported but never imported anywhere
- **Unreachable code**: Code after return statements or in impossible conditions

### 2. Duplicate/Repeated Code
- **Duplicate functions**: Same logic in multiple places
- **Repeated patterns**: Similar code blocks that could be refactored
- **Copy-pasted code**: Nearly identical code segments
- **Duplicate API calls**: Same fetch/axios patterns
- **Repeated utility logic**: Functions that should be in utils

### 3. Deprecated/Outdated Code
- **Commented-out code**: Old code left in comments
- **TODO/FIXME markers**: Unresolved technical debt
- **Console.log statements**: Debug logs left in production code
- **Deprecated packages**: Old library versions or deprecated APIs
- **Old feature flags**: Unused conditional code

### 4. Code Quality Issues
- **Unused dependencies**: package.json dependencies not imported anywhere
- **Large files**: Files >500 lines that should be split
- **Complex functions**: Functions >100 lines or high cyclomatic complexity
- **Missing error handling**: Try/catch opportunities
- **Inconsistent naming**: Different conventions in same codebase

### 5. Project-Specific Issues
- **Unused parsers**: Email parsers for vendors no longer supported
- **Orphaned database migrations**: Migration files with no corresponding rollback
- **Unused API endpoints**: Routes not called by frontend
- **Dead CSS/Tailwind classes**: Styles not used in components
- **Unused environment variables**: .env variables not referenced in code

## Audit Process

### Step 1: Initial Scan
1. Use static analysis tools appropriate for the language:
   - **JavaScript/TypeScript**: ESLint, TypeScript compiler
   - **React**: React DevTools analysis
   - **Node.js**: Dependency analysis
2. Scan entire codebase or specified scope
3. Generate preliminary findings list

### Step 2: Deep Analysis
1. Cross-reference findings across files
2. Check if "unused" code is actually used via dynamic imports
3. Identify code that's only used in comments or strings
4. Analyze import/export chains
5. Check for indirect usage (reflection, dynamic requires, etc.)

### Step 3: Categorize Findings
Group findings by:
- **Safety Level**: Safe to remove, Probably safe, Needs review, Risky
- **Impact**: High impact, Medium, Low
- **Type**: Import, Function, Variable, File, etc.
- **Location**: Frontend, Backend, Shared, Config

### Step 4: Generate Report
Create detailed report with:
- Summary statistics
- Findings organized by category
- Specific file locations and line numbers
- Recommended actions
- Estimated cleanup impact (LOC reduction, bundle size, etc.)

## Report Format

```markdown
# Codebase Cleanup Audit Report

**Generated**: [Timestamp]
**Scope**: [all/frontend/backend/path]
**Total Issues Found**: X

---

## Executive Summary

- 🗑️ **Unused Code**: X items (Y lines of code)
- 📋 **Duplicate Code**: X instances (Y lines)
- ⚠️ **Deprecated Code**: X items
- 🎯 **Quick Wins**: X items (safe to remove)
- 🔍 **Needs Review**: X items (manual check needed)

**Estimated Impact**: Remove ~X lines of code, reduce bundle size by ~Y KB

---

## 🗑️ Unused Code (X items)

### Unused Imports (X items)
**Impact**: Low | **Safety**: Safe to remove

1. **File**: `src/services/ModernOpticalService.js:5`
   ```javascript
   import { unusedHelper } from './helpers';  // ❌ Never used
   ```
   **Recommendation**: Remove this import
   **Command**: Auto-fixable

2. [More items...]

### Unused Functions (X items)
**Impact**: Medium | **Safety**: Probably safe

1. **File**: `src/utils/calculations.js:42-58`
   ```javascript
   export function calculateDeprecatedMargin(price, cost) {
     // 17 lines of code
   }
   ```
   **References**: None found
   **Exported**: Yes, but never imported
   **Recommendation**: Remove function and add to changelog
   **Command**: Needs confirmation

[More categories...]

---

## 📋 Duplicate Code (X instances)

### High Duplication (X instances)

1. **Pattern**: Vendor parser initialization logic
   **Locations**:
   - `src/services/ModernOpticalService.js:15-25` (11 lines)
   - `src/services/SafiloService.js:12-22` (11 lines)
   - `src/services/LuxotticaService.js:18-28` (11 lines)
   
   **Similarity**: 95% identical
   **Recommendation**: Extract to `BaseVendorParser.js`
   **Potential Savings**: 22 lines of code
   **Impact**: Medium (requires refactoring)

[More patterns...]

---

## ⚠️ Deprecated/Outdated Code

### Console.log Statements (X items)
**Impact**: Low | **Safety**: Safe to remove

1. `src/components/Dashboard.jsx:42` - `console.log('Debug: inventory data', data)`
2. `src/services/SafiloService.js:89` - `console.log('Fetching Safilo products')`
[More items...]

### TODO/FIXME Comments (X items)

1. `backend/routes/inventory.js:34` - `// TODO: Add pagination support`
2. `src/utils/validation.js:67` - `// FIXME: This breaks with special characters`
[More items...]

---

## 🎯 Quick Wins (Safe to Auto-Fix)

These X items can be automatically fixed with no risk:

1. Remove X unused imports
2. Remove X console.log statements  
3. Remove X unused variables
4. Clean up X commented-out code blocks

**Run**: `/clean auto quick-wins` to fix these automatically

---

## 🔍 Needs Manual Review (X items)

These items need human judgment:

1. **Unused API endpoint**: `/api/legacy/old-inventory`
   - Might be used by external systems
   - Check with team before removing

2. **Large file**: `src/components/InventoryDashboard.jsx` (847 lines)
   - Should be split into smaller components
   - Requires architectural decision

[More items...]

---

## 📊 Project-Specific Issues

### Unused Vendor Parsers

1. **EtniaBarcelonaService.js**
   - Not referenced in router
   - Not in active vendor list
   - Last used: 3 months ago
   **Recommendation**: Archive to `archived-parsers/` folder

### Orphaned Dependencies

**package.json dependencies not imported:**
1. `moment` - Use `date-fns` instead (already installed)
2. `lodash` - Only 2 functions used, replace with native JS
3. `axios` - Replaced by native fetch, can be removed

**Potential Savings**: 450 KB from node_modules

---

## 🔧 Recommended Actions

### Priority 1: Quick Wins (Do Now)
```bash
/clean auto quick-wins
```
- Remove unused imports
- Remove console.logs
- Remove commented code
**Time**: 5 minutes | **Risk**: None

### Priority 2: Safe Removals (This Week)
- Remove unused functions (X items)
- Remove unused API endpoints
- Uninstall unused dependencies
**Time**: 30 minutes | **Risk**: Low

### Priority 3: Refactoring (This Month)
- Extract duplicate vendor parser logic
- Split large files
- Replace deprecated patterns
**Time**: 4 hours | **Risk**: Medium

### Priority 4: Technical Debt (Backlog)
- Resolve TODO/FIXME comments
- Improve code complexity
- Add missing error handling
**Time**: TBD | **Risk**: Varies

---

## 📈 Expected Impact

**Before Cleanup**:
- Total Lines: X,XXX
- Bundle Size: XXX KB
- Dead Code: X%

**After Cleanup**:
- Total Lines: X,XXX (-X%)
- Bundle Size: XXX KB (-X%)
- Dead Code: <1%

**Maintenance Impact**:
- Easier onboarding for new developers
- Faster build times
- Clearer codebase structure
- Reduced confusion from outdated patterns

---

## Next Steps

1. Review this report carefully
2. Choose a mode:
   - `/clean auto quick-wins` - Safe automatic fixes
   - `/clean interactive` - Review each change
   - `/clean audit [specific-area]` - Deep dive into one area
3. Test thoroughly after cleanup
4. Update documentation if significant changes made
5. Commit with clear message: "chore: cleanup unused code [clean command]"

---

## Notes

- This report is a snapshot as of [timestamp]
- Some "unused" code might be used dynamically (strings, reflection, etc.)
- Always test after cleanup, especially in production
- Consider team consensus for architectural changes
```

## Execution Workflow

### Mode: Audit (Default)
```bash
/clean audit
```
1. Scan codebase
2. Generate report (as shown above)
3. Save report to `.agent/audits/cleanup-report-YYYY-MM-DD.md`
4. Do NOT make any changes
5. Present summary and ask what user wants to do next

### Mode: Auto Quick-Wins
```bash
/clean auto quick-wins
```
1. Identify safe-to-remove items (unused imports, console.logs)
2. Automatically fix them
3. Generate summary of changes made
4. Suggest running tests

### Mode: Interactive
```bash
/clean interactive
```
1. Scan and identify issues
2. For each issue, show:
   - The code
   - Why it's flagged
   - Recommendation
3. Ask: "Remove this? (yes/no/skip-category)"
4. Apply approved changes
5. Generate summary

### Mode: Aggressive
```bash
/clean aggressive
```
⚠️ **Use with extreme caution!**
1. Remove ALL detected unused code
2. Remove ALL duplicate patterns (keep first instance)
3. Remove ALL deprecated code
4. Generate detailed changelog
5. STRONGLY suggest creating backup branch first

## Safety Mechanisms

### Before Making Any Changes

1. **Backup Recommendation**: Suggest creating a git branch
   ```
   ⚠️ Recommended: Create a backup branch first:
   git checkout -b cleanup/automated-cleanup-YYYY-MM-DD
   ```

2. **Scope Confirmation**: Confirm scope with user
   ```
   About to clean [X] files in [scope].
   This will modify [Y] lines of code.
   Continue? (yes/no)
   ```

3. **Test Reminder**: Remind to run tests after cleanup
   ```
   ✅ Cleanup complete!
   
   ⚠️ Important: Run your test suite now:
   npm test (frontend)
   npm run test:backend (backend)
   ```

### Items to NEVER Auto-Remove

- Code in `node_modules/` (obviously)
- Code with `@keep` or `@preserve` comments
- Files in `.gitignore`
- Environment configuration files
- Database migration files (even if unused)
- Any file with "backup" or "archive" in path
- Code marked with `// DO NOT REMOVE` comments

### Items That Need Extra Caution

- Exported functions (might be used by external systems)
- API endpoints (might be called by mobile apps, external services)
- Environment variables (might be used in production)
- Database queries (might be used in cron jobs)
- Webhook handlers (might receive external calls)

## Analysis Tools & Strategies

### For JavaScript/TypeScript

```javascript
// Use ESLint
- eslint --no-eslintrc --rule "no-unused-vars:error"
- TypeScript compiler with noUnusedLocals, noUnusedParameters

// Dependency analysis
- depcheck (for unused dependencies)
- bundle analyzer (for bundle size)

// Custom AST analysis
- Parse with @babel/parser
- Traverse with @babel/traverse
- Identify unused exports/imports
```

### For React Components

```javascript
// Check component usage
- Search for component imports across codebase
- Check if component is in route definitions
- Verify component isn't dynamically imported

// Check props usage
- Analyze destructured props
- Flag props that are never used
```

### For Backend Code

```javascript
// API endpoint analysis
- Parse route definitions
- Search for fetch/axios calls in frontend
- Check if endpoint is in API documentation

// Database query analysis
- Find query definitions
- Check if used in routes or services
```

### For Styles

```javascript
// Tailwind class analysis
- Extract all className strings
- Compare against used classes
- Flag unused utility classes

// CSS analysis
- Parse stylesheets
- Check if selectors exist in markup
```

## Integration with Documentation System

After cleanup, automatically trigger documentation updates:

```bash
# After /clean auto or /clean interactive
→ Automatically run: /update-doc sop cleanup-results
→ Log what was removed and why
→ Update system docs if significant changes

# Generate cleanup SOP
→ Document patterns that led to bloat
→ Create prevention guidelines
→ Update code review checklist
```

## Special Handling for Opti-Profit

### Vendor Parser Cleanup

When cleaning vendor parsers:
1. Don't remove if vendor is in active `vendors` table
2. Archive instead of delete (move to `archived-parsers/`)
3. Update documentation to mark as archived
4. Keep parser structure as reference for future parsers

### Email Parsing Templates

When cleaning email parsing code:
1. Never remove raw email storage logic
2. Keep parsing history for audit purposes
3. Archive old parser versions with timestamp
4. Maintain backward compatibility for historical data

### Database Related

When cleaning database code:
1. NEVER auto-remove migrations
2. Flag unused tables but don't drop
3. Suggest archiving old migrations after team review
4. Keep schema documentation up-to-date

## Example Usage

```bash
# Full audit report
/clean audit

# Audit specific area
/clean audit backend/services

# Safe automatic cleanup
/clean auto quick-wins

# Interactive cleanup with confirmations
/clean interactive frontend

# Nuclear option (after backing up!)
git checkout -b cleanup-branch
/clean aggressive
npm test
```

## Output After Running

```
🧹 Codebase Cleanup Audit Complete!

📊 Summary:
- Scanned: 247 files
- Issues found: 134 items
- Unused code: 47 items (~890 lines)
- Duplicate code: 12 patterns
- Quick wins available: 28 items

📄 Full report saved to:
.agent/audits/cleanup-report-2024-11-06.md

🎯 Recommended next steps:
1. Review the report: [link]
2. Run: /clean auto quick-wins (safe, 28 items)
3. Manually review: 19 items needing human judgment

Would you like me to:
1. Run auto cleanup on quick wins?
2. Start interactive cleanup?
3. Focus on specific area?
```

## Best Practices

### When to Run /clean

- ✅ **Monthly maintenance**: Regular cleanup prevents bloat
- ✅ **Before major refactors**: Clean slate for big changes
- ✅ **After feature completion**: Remove experimental/dead code
- ✅ **Before code review**: Clean up before team review
- ✅ **After dependency updates**: Remove deprecated patterns

### When NOT to Run /clean

- ❌ Right before production deployment
- ❌ When tests are failing (fix tests first)
- ❌ Without a backup/branch
- ❌ On code you don't understand
- ❌ Without team consensus on major changes

### After Running /clean

1. **Run full test suite**
2. **Manually test critical paths**
3. **Review git diff before committing**
4. **Update documentation** if significant changes
5. **Run build to check for errors**
6. **Consider pair review** for aggressive cleanups

## Troubleshooting

### "Clean removed code that was actually used"

**Recovery:**
```bash
git diff HEAD
git checkout HEAD -- [affected-file]
```

**Prevention:**
- Use `audit` mode first
- Use `interactive` instead of `auto`
- Add `// @keep` comments to preserve code
- Test thoroughly before committing

### "Report shows false positives"

**Common causes:**
- Dynamic imports not detected
- String-based references
- Webpack/build tool magic
- External API calls

**Solution:**
Add exclusions to the command or use interactive mode

### "Aggressive mode removed too much"

**Recovery:**
```bash
git reset --hard HEAD~1
```

**Lesson:**
Always use `audit` first, then `interactive`, and only use `aggressive` if you're 100% sure + have backups

---

## Summary

The `/clean` command helps maintain a healthy codebase by:
- 🔍 Finding unused and duplicate code
- 🗑️ Safely removing dead code
- 📊 Providing detailed audit reports
- 🎯 Suggesting actionable improvements
- 📈 Reducing codebase complexity over time

**Remember**: Cleanup is maintenance, not perfection. Focus on high-impact improvements and always test after cleanup!