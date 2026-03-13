param(
    [string]$DestinationPath = "..\SparkHub-clean-repo",
    [switch]$Overwrite
)

$ErrorActionPreference = 'Stop'

$sourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$destinationRoot = Resolve-Path -Path (Join-Path $sourceRoot $DestinationPath) -ErrorAction SilentlyContinue
if (-not $destinationRoot) {
    $destinationRoot = Join-Path $sourceRoot $DestinationPath
} else {
    $destinationRoot = $destinationRoot.Path
}

if ((Test-Path $destinationRoot) -and -not $Overwrite) {
    Write-Host "Destination already exists: $destinationRoot" -ForegroundColor Yellow
    Write-Host "Run with -Overwrite to replace it." -ForegroundColor Yellow
    exit 1
}

if (Test-Path $destinationRoot) {
    Remove-Item -Recurse -Force $destinationRoot
}
New-Item -ItemType Directory -Path $destinationRoot | Out-Null

$foldersToCopy = @('frontend', 'backend', 'ML')
$excludeDirs = @('node_modules', 'dist', '.venv', 'runs', '__pycache__', '.pytest_cache', '.git')
$excludeFiles = @('.env', '*.log')

function Copy-FolderClean {
    param(
        [string]$From,
        [string]$To
    )

    New-Item -ItemType Directory -Path $To -Force | Out-Null

    $cmdArgs = @(
        "`"$From`"",
        "`"$To`"",
        '/E',
        '/R:1',
        '/W:1',
        '/NFL',
        '/NDL',
        '/NJH',
        '/NJS',
        '/NP'
    )

    if ($excludeDirs.Count -gt 0) {
        $cmdArgs += '/XD'
        $cmdArgs += $excludeDirs
    }

    if ($excludeFiles.Count -gt 0) {
        $cmdArgs += '/XF'
        $cmdArgs += $excludeFiles
    }

    $argString = $cmdArgs -join ' '
    $null = Start-Process -FilePath 'robocopy.exe' -ArgumentList $argString -Wait -NoNewWindow -PassThru
    $code = $LASTEXITCODE

    if ($code -gt 7) {
        throw "Robocopy failed for $From -> $To with exit code $code"
    }
}

foreach ($folder in $foldersToCopy) {
    $from = Join-Path $sourceRoot $folder
    $to = Join-Path $destinationRoot $folder

    if (-not (Test-Path $from)) {
        Write-Host "Skipping missing folder: $folder" -ForegroundColor Yellow
        continue
    }

    Write-Host "Copying $folder ..." -ForegroundColor Cyan
    Copy-FolderClean -From $from -To $to
}

Write-Host ""
Write-Host "✅ Clean export created at: $destinationRoot" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1) cd `"$destinationRoot`"" -ForegroundColor White
Write-Host "2) git init" -ForegroundColor White
Write-Host "3) Add your own .env files in frontend/, backend/, ML/" -ForegroundColor White
Write-Host "4) git add . ; git commit -m \"Initial import\"" -ForegroundColor White
Write-Host "5) Push to your new GitHub repo" -ForegroundColor White
