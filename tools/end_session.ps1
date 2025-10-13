# tools\end_session.ps1
# Usage: powershell -ExecutionPolicy Bypass -File tools\end_session.ps1
# Exports today's commits in 2 useful formats to .logs and shows where to paste in Notion.

$ErrorActionPreference = "Stop"
$repoRoot = (git rev-parse --show-toplevel) 2>$null
if (!$repoRoot) { Write-Error "Not in a Git repo. cd into your project root."; exit 1 }
Set-Location $repoRoot

$today = Get-Date -Format "yyyy-MM-dd"
$since = (Get-Date).Date.ToString("yyyy-MM-dd")

$dir = ".logs"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

$linear = Join-Path $dir "commits_$today.txt"
$detailed = Join-Path $dir "commits_$today_stat.txt"

git log --since="$since" --reverse --pretty=format:"%ad | %h | %an | %s" --date=iso > $linear
git log --since="$since" --reverse --stat > $detailed

Write-Host ""
Write-Host "✅ Exported:" -ForegroundColor Green
Write-Host "  $linear"
Write-Host "  $detailed"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1) Paste the contents of $linear into Notion → Changelog (newest at top)."
Write-Host "2) If needed, attach $detailed in Appendix B → Git Evidence."
Write-Host "3) Add any ⚠️ false fixes, ❌ mistakes, or 🔄 decisions as single bullets."
