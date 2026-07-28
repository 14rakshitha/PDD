# Starts LawVoice backend without requiring Maven on PATH.
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Tools = Join-Path $Root ".tools"
$MavenVersion = "3.9.16"
$MavenHome = Join-Path $Tools "apache-maven-$MavenVersion"
$MvnCmd = Join-Path $MavenHome "bin\mvn.cmd"

function Download-MavenZip {
    param([string]$Destination)
    $urls = @(
        "https://dlcdn.apache.org/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip",
        "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"
    )
    foreach ($url in $urls) {
        try {
            Write-Host "Trying $url ..." -ForegroundColor DarkGray
            Invoke-WebRequest -Uri $url -OutFile $Destination -UseBasicParsing
            if ((Get-Item $Destination).Length -gt 1MB) {
                return
            }
        } catch {
            Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
        }
    }
    throw "Could not download Maven $MavenVersion. Use .\run.ps1 again or install JDK 17+."
}

function Ensure-Maven {
    if (Get-Command mvn -ErrorAction SilentlyContinue) {
        return "mvn"
    }
    if (Test-Path $MvnCmd) {
        return $MvnCmd
    }

    Write-Host "Maven not found. Downloading Apache Maven $MavenVersion (one-time)..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $Tools | Out-Null
    $zip = Join-Path $Tools "maven.zip"
    Download-MavenZip -Destination $zip
    Expand-Archive -Path $zip -DestinationPath $Tools -Force
    Remove-Item $zip -Force
    if (-not (Test-Path $MvnCmd)) {
        throw "Maven extract failed. Delete backend\.tools and run .\run.ps1 again."
    }
    return $MvnCmd
}

$mvn = Ensure-Maven
Set-Location $Root

# ── Load .env file (look in backend dir first, then project root) ──────────────
$EnvFile = Join-Path $Root ".env"
if (-not (Test-Path $EnvFile)) {
    $EnvFile = Join-Path (Split-Path $Root -Parent) ".env"
}
if (Test-Path $EnvFile) {
    Write-Host "Loading environment from $EnvFile ..." -ForegroundColor Cyan
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $key   = $parts[0].Trim()
                $value = $parts[1].Trim()
                # Only set if not already set in the environment
                if (-not [System.Environment]::GetEnvironmentVariable($key)) {
                    [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
                    Write-Host "  Set $key" -ForegroundColor DarkGray
                }
            }
        }
    }
} else {
    Write-Host "No .env file found. Create $EnvFile with SARVAM_API_KEY=<your_key>" -ForegroundColor Yellow
}

Write-Host "Starting LawVoice backend on http://localhost:8080 ..." -ForegroundColor Green
$env:MAVEN_OPTS = "-Dfile.encoding=UTF-8"
& $mvn spring-boot:run @args
