# Opti-Profit Project - Claude Code Configuration

## Project Overview
This is a SaaS platform for optical practices providing inventory management, vendor intelligence, and profitability analysis. The platform consists of a React/TypeScript frontend, Node.js/Express backend, PostgreSQL database (Supabase), and n8n workflow automation for email parsing.

## Documentation System

### Documentation Structure
All project documentation is stored in the `.agent/` folder with the following structure:

```
.agent/
├── README.md              # Index of all documentation
├── system/               # System-level documentation
│   ├── architecture.md   # Overall system architecture
│   ├── database-schema.md # Database structure and relationships
│   ├── api-endpoints.md  # API documentation
│   └── email-pipeline.md # Email parsing workflow
├── tasks/                # Implementation plans (PRDs)
│   └── [feature-name].md # Saved implementation plans
└── sops/                 # Standard Operating Procedures
    └── [process-name].md # Step-by-step processes
```

### Core Rules

1. **Always Read README First**: Before planning any implementation, read `.agent/README.md` to understand available context
2. **Update After Implementation**: After completing any feature, update relevant documentation in `.agent/`
3. **Save Implementation Plans**: All implementation plans should be saved in `.agent/tasks/` before execution
4. **Create SOPs for Repeatable Tasks**: Document standard processes in `.agent/sops/` to avoid repeated mistakes
5. **Link Related Docs**: Each SOP should reference related documentation files

### When to Update Documentation

- ✅ After implementing new features
- ✅ After fixing complex bugs
- ✅ After making architectural decisions
- ✅ When creating reusable patterns
- ✅ When correcting mistakes (to prevent recurrence)

### Documentation Best Practices

- Keep docs concise and scannable
- Use clear headers and bullet points
- Include code examples where relevant
- Link between related documents
- Update README.md when adding new docs
- Focus on "why" not just "what"

## Tech Stack Reference

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion  
**Backend**: Node.js, Express  
**Database**: PostgreSQL (Supabase)  
**Deployment**: Vercel (frontend), Render (backend)  
**Automation**: n8n workflows, CloudMailin webhooks  
**Development**: Claude Code, Git/GitHub

## Architecture Philosophy

- **Database Complexity Over Frontend Complexity**: Let machines do the heavy lifting
- **Modular Parser Development**: Build and test standalone before integration
- **Branch-Based Development**: Feature branches with Vercel preview deployments
- **Progressive Enhancement**: Core functionality first, advanced features later