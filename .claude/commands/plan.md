# Plan Feature Command

## Purpose
Create detailed implementation plans using plan mode with full documentation context.

## Usage
```
/plan [feature-description]
```

## Workflow

This command follows a strict sequence:

### Step 1: Load Documentation Context
- Automatically run `/read-docs` to load relevant documentation
- Identify related SOPs, past implementations, and system docs
- Load database schema and architecture if needed

### Step 2: Research & Analysis (Plan Mode)
- **MUST use Claude's plan mode** for this step
- Analyze the feature requirements thoroughly
- Research implementation approaches
- Identify dependencies and impacts on existing code
- Consider edge cases and potential issues

### Step 3: Generate Implementation Plan
Create a structured plan with these sections:

```markdown
# Feature: [Feature Name]

## Overview
Brief description of what we're building and why

## Requirements
- Functional requirement 1
- Functional requirement 2
- Non-functional requirements

## Technical Approach
High-level strategy and architectural decisions

## Implementation Steps

### Phase 1: [Component/Area]
1. Specific step with file locations
2. Specific step with code changes
3. ...

### Phase 2: [Component/Area]
1. Specific step
2. ...

## Database Changes
- Schema modifications needed
- Migration strategy

## API Changes
- New endpoints or modifications
- Request/response formats

## Testing Strategy
- Unit tests needed
- Integration tests
- Manual testing steps

## Dependencies
- External packages to install
- Internal modules that need updates

## Rollout Plan
1. Development/testing steps
2. Staging validation
3. Production deployment

## Related Documentation
- [Link to relevant SOP]
- [Link to similar implementation]

## Potential Issues & Mitigations
| Issue | Mitigation |
|-------|------------|
| Problem 1 | How we'll handle it |
| Problem 2 | How we'll handle it |
```

### Step 4: Save the Plan
- Automatically save to `.agent/tasks/[feature-name].md`
- Update `.agent/README.md` with the new task
- Provide file path for verification

### Step 5: Ready to Implement
Ask user: "Implementation plan saved. Ready to start implementing? (yes/no)"

## Plan Mode Requirements

When using plan mode during this command:
- **Think deeply** about the problem space
- **Research** similar implementations in the codebase
- **Consider** multiple approaches before choosing one
- **Document reasoning** for architectural decisions
- **Identify pitfalls** based on past SOPs
- **Cross-reference** with existing system documentation

## Rules for Good Implementation Plans

1. **Be Specific**: "Update UserService.js line 45" not "modify user service"
2. **Include File Paths**: Always specify exact files to modify
3. **Order Matters**: Steps should be in logical execution order
4. **Reference Docs**: Link to relevant SOPs and system docs
5. **Anticipate Issues**: Call out potential problems before they happen
6. **Test Coverage**: Include what needs to be tested and how
7. **Rollback Strategy**: How to undo changes if something breaks

## When to Use This Command

✅ **Always use for:**
- New features (any size)
- Major refactors
- Database schema changes
- API changes
- Integration with new services
- Complex bug fixes

❌ **Don't use for:**
- Simple typo fixes
- Minor text changes
- Updating documentation only
- Single-line bug fixes

## Integration with Documentation System

This command creates a feedback loop:

```
/plan → Creates implementation plan
         ↓
       Implement feature
         ↓
/update-doc sop → Documents the process
         ↓
Next time: /plan uses previous SOPs
```

## Example Usage

```bash
# Plan a new vendor parser
/plan Add email parser for Luxottica vendor

# Plan a database migration
/plan Add inventory_adjustments table for tracking manual changes

# Plan an integration
/plan Integrate with Replicate API for AI image generation

# Plan a refactor
/plan Refactor email parsing pipeline to support batch processing
```

## Output Format

After generating plan, show:

```
📋 Implementation Plan Generated

Feature: [Name]
Complexity: [Low/Medium/High]
Estimated LOC: ~XXX lines
Files to modify: X files
New files: Y files

Key Decisions:
- [Important architectural choice 1]
- [Important architectural choice 2]

⚠️ Risks Identified:
- [Risk 1 with mitigation]
- [Risk 2 with mitigation]

📁 Plan saved to: .agent/tasks/[feature-name].md

Ready to implement? (yes/no)
```

## After Running This Command

Next steps:
1. Review the generated plan
2. User approves or requests modifications
3. If approved: "Save this plan and start implementing"
4. Claude saves plan and begins implementation
5. After completion: Run `/update-doc sop` to document the process

## Tips for Users

- **Be descriptive** in your feature description
- **Mention constraints** if any (performance, budget, timeline)
- **Reference similar features** if applicable
- **Ask questions** if the plan isn't clear
- **Iterate on the plan** before implementing