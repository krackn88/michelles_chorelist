# Secure Repository Update Script
# Created: 2025-03-28
# For: michelles_chorelist repository

# ----- Configuration -----
$repoDir = "D:\DCombos\family-chore-manager"
$repoUrl = "https://github.com/krackn88/michelles_chorelist.git"
$backupDir = "D:\DCombos\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$logFile = "D:\DCombos\repo_update_log.txt"

# ----- Functions -----
function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry
}

function Backup-Repository {
    Write-Log "Creating backup of current repository..."
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    Copy-Item -Path "$repoDir\*" -Destination $backupDir -Recurse -Force
    Write-Log "Backup created at: $backupDir"
}

function Clean-Repository {
    Write-Log "Cleaning repository of sensitive files..."
    
    # Remove specific sensitive files
    $sensitiveFiles = @(
        "update_repo.ps1"
    )
    
    foreach ($file in $sensitiveFiles) {
        $filePath = Join-Path $repoDir $file
        if (Test-Path $filePath) {
            Remove-Item -Path $filePath -Force
            Write-Log "Removed sensitive file: $file"
        }
    }
    
    # Remove any potential credential files or directories
    $credentialPatterns = @(
        "*secret*",
        "*token*",
        "*cred*",
        "*.env",
        "*config.json"
    )
    
    foreach ($pattern in $credentialPatterns) {
        $matches = Get-ChildItem -Path $repoDir -Recurse -File -Filter $pattern
        foreach ($match in $matches) {
            # Check if the file likely contains credentials before removing
            $content = Get-Content $match.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -match "(key|token|secret|password|api|auth).*[a-zA-Z0-9_\-]{20,}") {
                Write-Log "Potential credential detected in: $($match.FullName)"
                # Instead of removing, let's clean the file
                $cleanContent = $content -replace "(key|token|secret|password|api|auth).*[a-zA-Z0-9_\-]{20,}", '$1: "REMOVED_FOR_SECURITY"'
                Set-Content -Path $match.FullName -Value $cleanContent
                Write-Log "Cleaned sensitive content from: $($match.FullName)"
            }
        }
    }
}

function Update-Repository {
    Set-Location $repoDir
    
    # Initialize git if not already initialized
    if (-not (Test-Path "$repoDir\.git")) {
        Write-Log "Initializing git repository..."
        git init
        git remote add origin $repoUrl
    }
    
    # Make sure we're working with the latest
    Write-Log "Fetching latest changes..."
    git fetch origin
    
    # Create a new branch for our changes
    $branchName = "update-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Log "Creating new branch: $branchName"
    git checkout -b $branchName
    
    # Add all files
    Write-Log "Adding files to git..."
    git add .
    
    # Commit changes
    Write-Log "Committing changes..."
    git commit -m "Complete repository update with new files and structure"
    
    # Push to origin
    Write-Log "Pushing to remote repository..."
    git push -u origin $branchName
    
    Write-Log "Changes pushed to branch: $branchName"
    Write-Log "Please create a pull request on GitHub to merge these changes into main"
}

# ----- Main Execution -----
try {
    Write-Log "=== Starting repository update process ==="
    Backup-Repository
    Clean-Repository
    Update-Repository
    Write-Log "=== Repository update completed successfully ==="
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "Stack Trace: $($_.ScriptStackTrace)"
    Write-Log "=== Repository update failed ==="
}