Write-Host "ðŸ”§ Setting up Git auto-authentication..." -ForegroundColor Cyan

# 1. Configure identity
git config --global user.name "Atlassy"
git config --global user.email "benaqa@gmail.com"

# 2. Set credential manager
git config --global credential.helper manager

# 3. Set default branch name
git config --global init.defaultBranch main

# 4. Set auto CRLF handling for Windows
git config --global core.autocrlf true

# 5. Verify settings
Write-Host "`nâœ… Git Configuration:" -ForegroundColor Green
git config --global --list | Select-String -Pattern "user|credential|core"

# 6. Instructions
Write-Host "`nðŸ” Next steps:" -ForegroundColor Yellow
Write-Host "   1. First push will prompt for credentials" -ForegroundColor Yellow
Write-Host "   2. Username: Atlassy" -ForegroundColor Yellow
Write-Host "   3. Password: [Your Personal Access Token]" -ForegroundColor Yellow
Write-Host "   4. Credentials will be saved automatically" -ForegroundColor Green
