# ENGAGE Project Tools

This folder contains PowerShell scripts and Cursor audit prompts for tracking development progress and generating change summaries.

## Files Overview

### PowerShell Scripts
- **`end_session.ps1`** - Daily commit export to `.logs/` folder
  - Usage: `powershell -ExecutionPolicy Bypass -File tools\end_session.ps1`
  - Exports today's commits in linear and detailed formats
  - Provides Notion integration instructions

### Cursor Audit Prompts
- **`cursor_audit_prompt.txt`** - Whole-app change audit (14-30 days)
  - Deep analysis of all ENGAGE MVP changes
  - 10-section structured report
  - Use for comprehensive project reviews

- **`cursor_audit_daily.txt`** - Daily delta snapshot
  - Quick summary of today's changes only
  - 5-section format (Summary, Files, Changes, Risks, Next Steps)
  - Perfect for end-of-day documentation

- **`cursor_audit_feature.txt`** - Feature-scoped audit
  - Focused analysis of specific feature changes
  - Replace placeholder with feature title
  - 4-section format (Touchpoints, Data Flow, Test Points, Gaps)

- **`changelog_line_prompt.txt`** - Auto-format changelog entries
  - Converts commit/diff text to emoji-tagged changelog lines
  - Supports ✅ (success), ⚠️ (false fix), ❌ (mistake), 🔄 (decision) tags
  - Paste commit text as input

## Usage Workflow

### Daily End-of-Session
1. Run `powershell -ExecutionPolicy Bypass -File tools\end_session.ps1`
2. (Optional) Copy `cursor_audit_daily.txt` content to Cursor for today's summary
3. Paste daily summary into Notion → Changelog

### Feature Completion
1. Copy `cursor_audit_feature.txt` content to Cursor
2. Replace placeholder with feature title (e.g., "volunteer_signed_up notifications")
3. Get focused analysis of that feature's changes

### Project Milestone
1. Copy `cursor_audit_prompt.txt` content to Cursor
2. Get comprehensive 14-30 day change analysis
3. Update project documentation/Notion Appendix

### Changelog Entries
1. Copy `changelog_line_prompt.txt` content to Cursor
2. Paste commit message or diff text as input
3. Get formatted changelog line with emoji tag

## Generated Files
- `.logs/commits_YYYY-MM-DD.txt` - Linear commit format
- `.logs/commits_YYYY-MM-DD_stat.txt` - Detailed commit with file changes

## Integration
- **Notion**: Paste linear commits into Changelog, detailed commits into Appendix B
- **Control Log**: Use daily summaries for progress tracking
- **Documentation**: Use feature audits for specific change documentation
