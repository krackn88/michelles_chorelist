# Secure Credential Manager for Family Chore Manager
# Created: 2025-03-28
# Author: GitHub Copilot for krackn88

# ----- Configuration -----
$credentialStore = "D:\DCombos\family-chore-manager\credentials"
$encryptionKeyFile = "D:\DCombos\family-chore-manager\credentials\.key"
$credentialFile = "D:\DCombos\family-chore-manager\credentials\secure_creds.xml"
$logFile = "D:\DCombos\credential_manager_log.txt"

# ----- Functions -----
function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry
}

function Initialize-CredentialStore {
    # Create credential directory if it doesn't exist
    if (!(Test-Path $credentialStore)) {
        New-Item -ItemType Directory -Path $credentialStore -Force | Out-Null
        Write-Log "Created credential store directory"
    }
    
    # Create or validate encryption key
    if (!(Test-Path $encryptionKeyFile)) {
        # Generate a new encryption key
        $encryptionKey = New-Object byte[] 32
        [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($encryptionKey)
        $encryptionKey | Set-Content $encryptionKeyFile -Encoding Byte
        Write-Log "Generated new encryption key"
    }
    
    # Secure the credentials directory and key file
    $acl = Get-Acl $credentialStore
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentUser, "FullControl", "Allow")
    $acl.SetAccessRule($accessRule)
    Set-Acl $credentialStore $acl
    
    $keyAcl = Get-Acl $encryptionKeyFile
    $keyAcl.SetAccessRule($accessRule)
    Set-Acl $encryptionKeyFile $keyAcl
    
    Write-Log "Secured credential store with proper permissions"
}

function Get-EncryptionKey {
    if (!(Test-Path $encryptionKeyFile)) {
        Initialize-CredentialStore
    }
    return Get-Content $encryptionKeyFile -Encoding Byte
}

function Save-SecureCredentials {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$credentials
    )
    
    # Create an XML representation of the credentials
    $xmlDoc = New-Object System.Xml.XmlDocument
    $root = $xmlDoc.CreateElement("SecureCredentials")
    $xmlDoc.AppendChild($root) | Out-Null
    
    # Add timestamp for audit
    $timestampElement = $xmlDoc.CreateElement("Timestamp")
    $timestampElement.InnerText = (Get-Date).ToString("o")
    $root.AppendChild($timestampElement) | Out-Null
    
    # Add each credential property
    $props = $credentials | Get-Member -MemberType NoteProperty
    foreach ($prop in $props) {
        $name = $prop.Name
        $value = $credentials.$name
        
        # Create element for credential
        $credElement = $xmlDoc.CreateElement("Credential")
        $nameAttr = $xmlDoc.CreateAttribute("name")
        $nameAttr.Value = $name
        $credElement.Attributes.Append($nameAttr) | Out-Null
        
        # Secure the value
        if ($value -is [System.Security.SecureString]) {
            $encValue = ConvertFrom-SecureString -SecureString $value
        } else {
            $secureValue = ConvertTo-SecureString -String $value -AsPlainText -Force
            $encValue = ConvertFrom-SecureString -SecureString $secureValue
        }
        
        $credElement.InnerText = $encValue
        $root.AppendChild($credElement) | Out-Null
    }
    
    # Save to file
    Initialize-CredentialStore
    $xmlDoc.Save($credentialFile)
    Write-Log "Saved secure credentials to store"
}

function Get-SecureCredentials {
    if (!(Test-Path $credentialFile)) {
        Write-Log "No credentials found in store"
        return $null
    }
    
    # Load the XML document
    $xmlDoc = New-Object System.Xml.XmlDocument
    $xmlDoc.Load($credentialFile)
    
    # Create result object
    $credentials = New-Object PSObject
    
    # Get all credential elements
    $credElements = $xmlDoc.SelectNodes("//Credential")
    foreach ($credElement in $credElements) {
        $name = $credElement.GetAttribute("name")
        $encValue = $credElement.InnerText
        
        # Decrypt the value
        $secureString = ConvertTo-SecureString -String $encValue
        
        # Add to credentials object
        $credentials | Add-Member -MemberType NoteProperty -Name $name -Value $secureString
    }
    
    Write-Log "Retrieved secure credentials from store"
    return $credentials
}

function Get-PlainTextCredential {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$credentials,
        [Parameter(Mandatory=$true)]
        [string]$name
    )
    
    if ($null -eq $credentials -or $null -eq $credentials.$name) {
        return $null
    }
    
    $secureString = $credentials.$name
    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Prompt-ForCredentials {
    $credentials = New-Object PSObject
    
    # Prompt for Cozi URL
    $coziUrl = Read-Host "Enter your Cozi calendar URL"
    $credentials | Add-Member -MemberType NoteProperty -Name "CoziUrl" -Value $coziUrl
    
    # Prompt for Cozi username (email)
    $coziUsername = Read-Host "Enter your Cozi email/username"
    $credentials | Add-Member -MemberType NoteProperty -Name "CoziUsername" -Value $coziUsername
    
    # Prompt for Cozi password (securely)
    $coziPassword = Read-Host "Enter your Cozi password" -AsSecureString
    $credentials | Add-Member -MemberType NoteProperty -Name "CoziPassword" -Value $coziPassword
    
    # Optional: API key if available
    $hasApiKey = Read-Host "Do you have a Cozi API key? (y/n)"
    if ($hasApiKey -eq "y") {
        $apiKey = Read-Host "Enter your Cozi API key"
        $credentials | Add-Member -MemberType NoteProperty -Name "CoziApiKey" -Value $apiKey
    }
    
    return $credentials
}

function Test-CredentialsExist {
    return (Test-Path $credentialFile)
}

# ----- Exports -----
Export-ModuleMember -Function Initialize-CredentialStore, Save-SecureCredentials, Get-SecureCredentials, Get-PlainTextCredential, Prompt-ForCredentials, Test-CredentialsExist
