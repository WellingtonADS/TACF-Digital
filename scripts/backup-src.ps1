Param(
    [string]$OutDir = "backup",
    [switch]$Compress
)

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path -Path $OutDir -ChildPath "src-$ts"
if(-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

Write-Host "Backing up src to: $out"
Copy-Item -Path "src" -Destination $out -Recurse -Force

if($Compress){
    $zip = "$out.zip"
    if(Test-Path $zip){ Remove-Item $zip }
    Compress-Archive -Path $out -DestinationPath $zip -Force
    Write-Host "Compressed to: $zip"
}

Write-Host "Backup complete."

Write-Host "To run: .\scripts\backup-src.ps1 -Compress"
