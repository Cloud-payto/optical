# Read Documentation Command

## Purpose
Load relevant project documentation into context before starting work on a task.

## Usage
```
/read-docs [optional: specific-topic]
```

## Behavior

### When No Topic Specified (`/read-docs`)
1. **Always start** by reading `.agent/README.md` to get the documentation index
2. Analyze the user's next intended task based on conversation context
3. Identify and read 2-4 most relevant documentation files:
   - Related system docs (architecture, database, API)
   - Related SOPs (standard processes)
   - Similar past implementation plans (tasks)
4. Provide a brief summary of what context was loaded
5. Ask user what they'd like to work on with this context

### When Topic Specified (`/read-docs email-parsing`)
1. Read `.agent/README.md` first
2. Search for documentation files related to the specified topic
3. Read all relevant files (system docs, SOPs, tasks)
4. Summarize the key information found
5. Ready to proceed with topic-specific work

## Context Loading Strategy

### For New Features
Read:
- System architecture
- Database schema
- Related SOPs (if similar feature was built before)
- Related task docs (past implementation plans)

### For Bug Fixes
Read:
- System docs for affected component
- Related SOPs (common pitfalls, debugging processes)
- Task docs if bug is in recently implemented feature

### For Refactoring
Read:
- Current architecture
- All SOPs related to the component
- Task docs showing why current implementation exists

## Smart Context Selection

Prioritize documentation that:
1. **Directly relates** to the mentioned feature/component
2. **Was recently updated** (check "Last Updated" dates)
3. **Contains patterns** we should follow or avoid
4. **Links to other docs** that might be relevant

Avoid loading:
- Unrelated system components
- Outdated docs (>6 months old without recent updates)
- Overly generic information already in .claude.md

## Output Format

After reading docs, respond with:

```
📚 Documentation Loaded:

System Documentation:
- architecture.md - Overall platform structure
- database-schema.md - PostgreSQL schema and relationships

Standard Operating Procedures:
- vendor-parser-development.md - How to add new vendor parsers

Past Implementations:
- vendor-parser-safilo.md - Similar email parsing implementation

🎯 Key Context:
- [2-3 most important takeaways from the docs]
- [Relevant patterns or pitfalls to remember]

Ready to proceed! What would you like to work on?
```

## Integration with Plan Mode

When user asks to plan a feature:
1. Automatically trigger `/read-docs` first (without asking)
2. Load relevant documentation
3. Then proceed with plan mode
4. Reference specific docs in the implementation plan

Example user prompt that should auto-trigger this:
- "Help me add text-to-video using Replicate" → Auto-read SOP: integrating-replicate-models
- "Create a new vendor parser for Luxottica" → Auto-read SOP: vendor-parser-development
- "Add a new API endpoint for inventory" → Auto-read system/api-endpoints.md

## Rules

1. **Always read README.md first** - It's the index to everything
2. **Don't overload context** - Max 4-5 documentation files per read
3. **Summarize, don't regurgitate** - Provide key takeaways, not full doc dumps
4. **Ask if unsure** - If topic is ambiguous, ask which docs to load
5. **Update if missing** - If expected docs don't exist, note that and offer to create them

## Example Usage

```bash
# Load general context before starting work
/read-docs

# Load specific topic context
/read-docs email-parsing
/read-docs database
/read-docs vendor-parsers

# Combined with planning
/read-docs replicate-integration
[then] Help me add image generation using Replicate models
```

## After Running This Command

User should be ready to:
- Start planning a feature with proper context
- Make informed architectural decisions
- Avoid repeating past mistakes documented in SOPs
- Follow established patterns from past implementations