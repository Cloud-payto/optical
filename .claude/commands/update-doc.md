# Update Documentation Command

## Purpose
This command updates project documentation after implementing features, fixing bugs, or establishing new patterns.

## Usage
```
/update-doc [type] [description]
```

**Types:**
- `initialize` - Set up the initial .agent/ folder structure
- `task` - Save an implementation plan to .agent/tasks/
- `sop` - Create/update a Standard Operating Procedure
- `system` - Update system-level documentation
- `create` - Create custom documentation (style guides, flows, references, etc.)

**Freeform Usage:**
You can also just describe what documentation you want created:
```
/update-doc make me a STYLE_GUIDE.md with all fonts, colors, and design tokens
/update-doc create a user-flow.md showing how data flows through the app
/update-doc I need documentation on our deployment process
```

If your prompt doesn't match a known type, Claude will treat it as a custom documentation request.

## Behavior

### When Initializing (`/update-doc initialize`)
1. Create `.agent/` directory structure (system/, tasks/, sops/)
2. Generate initial `README.md` as documentation index
3. Create `system/architecture.md` based on current codebase analysis
4. Create `system/database-schema.md` from database files
5. List all created documentation files

### When Creating SOPs (`/update-doc sop [topic]`)
1. Analyze the recent conversation for the specific process
2. Create a new SOP document in `.agent/sops/[topic].md` with:
   - **Purpose**: What this process accomplishes
   - **When to Use**: Scenarios where this applies
   - **Step-by-Step Process**: Clear, numbered steps
   - **Directory Structure**: Where files should be created
   - **Common Pitfalls**: Mistakes to avoid
   - **Related Documentation**: Links to relevant docs
3. Update `.agent/README.md` to include the new SOP

### When Saving Tasks (`/update-doc task [feature-name]`)
1. Look for the most recent implementation plan in the conversation
2. Save it to `.agent/tasks/[feature-name].md`
3. Format with clear sections: Overview, Requirements, Implementation Steps, Testing
4. Update `.agent/README.md` to reference the new task

### When Updating System Docs (`/update-doc system [component]`)
1. Identify which system doc needs updating (architecture, database, API, etc.)
2. Update the relevant file in `.agent/system/`
3. Preserve existing content, only update changed sections
4. Update `.agent/README.md` if new concepts are introduced

### When Creating Custom Docs (`/update-doc create [description]`)
This is for any documentation that doesn't fit the standard categories (SOPs, tasks, system docs).

**Usage Examples:**
```bash
# Create a style guide
/update-doc create STYLE_GUIDE.md with all fonts, colors, spacing, design tokens, and component styling patterns

# Create a user flow document
/update-doc create user-flow.md showing how users and data flow through the app from login to checkout

# Create deployment documentation
/update-doc create deployment-guide.md documenting our Vercel frontend and Render backend deployment process

# Create testing guide
/update-doc create TESTING_GUIDE.md with our testing patterns, conventions, and how to run tests

# Create onboarding doc
/update-doc create ONBOARDING.md for new developers joining the project

# Create environment setup
/update-doc create ENV_SETUP.md documenting all environment variables and configuration

# Create troubleshooting guide
/update-doc create TROUBLESHOOTING.md with common errors and solutions

# Create contribution guide
/update-doc create CONTRIBUTING.md with git workflow, branch naming, commit conventions
```

**Behavior:**
1. **Analyze the request** to understand what documentation is needed
2. **Scan relevant codebase** to extract actual information:
   - For STYLE_GUIDE: scan CSS/Tailwind config, component styles, design tokens
   - For user-flow: analyze routes, components, data flow, authentication
   - For deployment: check package.json scripts, config files, deployment settings
3. **Determine best location**:
   - **Style/Design/Flows**: `.agent/system/` (architecture-related)
   - **Processes/Guides**: `.agent/sops/` (how-to documentation)
   - **Reference Material**: `.agent/reference/` (lookup information)
   - **Project-Level**: Project root (CONTRIBUTING.md, CODE_OF_CONDUCT.md, STYLE_GUIDE.md)
4. **Create comprehensive documentation** with:
   - Real examples from your codebase (not placeholders)
   - Actual values (real colors, real fonts, real URLs)
   - Clear structure and sections
   - Links to related documentation
5. **Update `.agent/README.md`** to reference the new documentation
6. **Inform you** of the file location and what was documented

**Smart Location Selection:**

| Document Type | Location | Example |
|--------------|----------|---------|
| Style guides, design systems | `.agent/system/` or project root | `STYLE_GUIDE.md` |
| User flows, architecture diagrams | `.agent/system/` | `user-flow.md` |
| Deployment, CI/CD processes | `.agent/sops/` | `deployment-guide.md` |
| Testing strategies | `.agent/sops/` | `testing-guide.md` |
| Environment setup | `.agent/reference/` | `environment-setup.md` |
| Contribution guidelines | Project root | `CONTRIBUTING.md` |
| Troubleshooting | `.agent/reference/` | `troubleshooting.md` |
| Onboarding | Project root or `.agent/` | `ONBOARDING.md` |

**Output After Creation:**
```
✅ Created: .agent/system/STYLE_GUIDE.md

📋 Documented:
- Color palette (8 colors from Tailwind config)
- Typography (3 font families: Inter, Roboto Mono, System)
- Spacing scale (Tailwind spacing tokens)
- Component patterns (12 components analyzed)
- Design tokens from your codebase

✅ Updated: .agent/README.md

📁 File location: .agent/system/STYLE_GUIDE.md
```

## Documentation Standards

### File Naming
- Use kebab-case: `email-parsing-pipeline.md`
- Be descriptive: `integrating-replicate-models.md` not `replicate.md`
- Group related docs: `vendor-parser-modern-optical.md`, `vendor-parser-safilo.md`

### Content Structure
Every documentation file should include:

```markdown
# [Title]

## Overview
Brief description of what this covers

## [Main Content Sections]
...

## Related Documentation
- Link to related docs
- Link to related docs

## Last Updated
[Date and reason for update]
```

### SOP Format
```markdown
# [Process Name]

## Purpose
What this accomplishes and why it matters

## When to Use
Specific scenarios where this process applies

## Prerequisites
What needs to be in place before starting

## Step-by-Step Process
1. First step with specific details
2. Second step...

## Directory Structure
```
expected/file/structure/
├── component.tsx
└── tests/
```

## Common Pitfalls
- Mistake to avoid #1
- Mistake to avoid #2

## Related Documentation
- [Link to related doc](./../system/related.md)

## Examples
Real examples from the codebase

## Last Updated
YYYY-MM-DD - [Reason]
```

## Important Rules

1. **Always Update README**: Every documentation change must update `.agent/README.md`
2. **Link Bidirectionally**: If Doc A references Doc B, Doc B should reference Doc A
3. **Keep It Current**: Add "Last Updated" dates to track freshness
4. **Be Specific**: "Use camelCase for variables" not "follow conventions"
5. **Include Context**: Explain WHY not just WHAT
6. **Real Examples**: Use actual code from the project, not placeholders

## After Running This Command

The agent should:
1. Execute the documentation update as specified
2. Provide a summary of what was created/updated
3. Show the file path(s) for easy verification
4. Remind user to commit changes to git

## Example Usage

```bash
# Initialize documentation system
/update-doc initialize

# Save current implementation plan
/update-doc task vendor-parser-safilo

# Create SOP after integrating Replicate
/update-doc sop integrating-replicate-models

# Update database schema after migration
/update-doc system database-schema

# Create custom documentation
/update-doc create STYLE_GUIDE.md with all design tokens, colors, fonts, and spacing
/update-doc create user-flow.md documenting how data flows through the application
/update-doc create deployment-guide.md for Vercel and Render deployments
/update-doc create TESTING_GUIDE.md with our testing patterns and how to run tests
```