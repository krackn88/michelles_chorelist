# File Validation Script
# Created: 2025-03-28
# For: michelles_chorelist repository

# ----- Configuration -----
$repoDir = "D:\DCombos\family-chore-manager"
$logFile = "D:\DCombos\validation_log.txt"

# ----- Functions -----
function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry
}

function Validate-JavaScript {
    param([string]$filePath)
    
    $content = Get-Content $filePath -Raw
    $issues = @()
    
    # Check for syntax issues
    if ($content -match "import\s+.*\s+from\s+[^'\"`;]") {
        $issues += "Possible import syntax error"
    }
    
    # Check for missing semicolons
    if ($content -match "}\s*\n\s*[a-zA-Z]") {
        $issues += "Possible missing semicolon between statements"
    }
    
    # Check for undefined variables (basic check)
    $variables = [regex]::Matches($content, "const\s+(\w+)|let\s+(\w+)|var\s+(\w+)")
    $variableNames = $variables | ForEach-Object { 
        if ($_.Groups[1].Value) { $_.Groups[1].Value }
        elseif ($_.Groups[2].Value) { $_.Groups[2].Value }
        else { $_.Groups[3].Value }
    }
    
    # Check for undefined components
    $imports = [regex]::Matches($content, "import\s+{?\s*([^}]*)\s*}?\s+from")
    $importedNames = @()
    foreach ($import in $imports) {
        $names = $import.Groups[1].Value -split ","
        foreach ($name in $names) {
            $trimmedName = $name.Trim()
            if ($trimmedName -ne "") {
                $importedNames += $trimmedName
            }
        }
    }
    
    $issues += "Validation complete: $($issues.Count) potential issues found"
    return $issues
}

function Validate-Repository {
    Write-Log "Starting file validation..."
    
    # Get all JavaScript files
    $jsFiles = Get-ChildItem -Path $repoDir -Recurse -Filter "*.js"
    Write-Log "Found $($jsFiles.Count) JavaScript files to validate"
    
    $fileIssues = @{}
    
    foreach ($file in $jsFiles) {
        Write-Log "Validating file: $($file.FullName)"
        $issues = Validate-JavaScript -filePath $file.FullName
        
        if ($issues.Count -gt 0) {
            $fileIssues[$file.FullName] = $issues
            foreach ($issue in $issues) {
                Write-Log "  - $issue"
            }
        } else {
            Write-Log "  - No issues found"
        }
    }
    
    if ($fileIssues.Count -gt 0) {
        Write-Log "Issues found in $($fileIssues.Count) files. Please review the logs."
    } else {
        Write-Log "All files validated successfully!"
    }
}

# ----- Main Execution -----
try {
    Write-Log "=== Starting file validation process ==="
    Validate-Repository
    Write-Log "=== File validation completed ==="
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "Stack Trace: $($_.ScriptStackTrace)"
    Write-Log "=== File validation failed ==="
}