# LIVORA Project Rules

1. **Security Boundaries:**
   - NEVER commit `.env` files or API keys.
   - Always run pre-commit hooks (Semgrep) to validate security boundaries before deployment.
2. **Architecture:**
   - Frontend is a mobile-first PWA using React + Tailwind.
   - Backend relies on Google ADK 2.0 graph workflows for agent orchestration.
   - Database is Supabase.
3. **No Terminal Shell Execution without User Approval:**
   - Do not execute destructive actions automatically. Ask the user.
