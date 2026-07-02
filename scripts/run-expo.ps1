param(
  [string]$Port = '8086'
)

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logDir = Join-Path $repoRoot '.expo\dev\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$outLog = Join-Path $logDir "expo-$Port.log"
$errLog = Join-Path $logDir "expo-$Port.err.log"

& (Join-Path $repoRoot 'node_modules\.bin\expo.cmd') start --port $Port *> $outLog 2> $errLog
