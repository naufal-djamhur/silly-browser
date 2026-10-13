param([string]$ReportPath)
$ErrorActionPreference='Stop'
$taskProjectRoot=Split-Path $PSScriptRoot -Parent
$taskLock=Get-Content (Join-Path $taskProjectRoot 'engine\upstream.lock.json') -Raw | ConvertFrom-Json
$taskVswhere='C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe'
$taskVs=if(Test-Path $taskVswhere){& $taskVswhere -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -format json | ConvertFrom-Json}else{@()}
$taskSdk=Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName -match '^Windows Software Development Kit'} | Select-Object DisplayName,DisplayVersion
$taskSdkReady=@($taskSdk | Where-Object {[version]$_.DisplayVersion -ge [version]'10.1.26100.4654'}).Count -gt 0
$taskDebugger='C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\dbghelp.dll'
$taskDebuggerVersion=if(Test-Path $taskDebugger){(Get-Item $taskDebugger).VersionInfo.FileVersion}else{'missing'}
$taskDebuggerReady=if(Test-Path $taskDebugger){(Get-Item $taskDebugger).VersionInfo.FileVersionRaw -ge [version]'10.0.26100.3323'}else{$false}
$taskMfc=if($taskVs){@(Get-ChildItem (Join-Path $taskVs.installationPath 'VC\Tools\MSVC') -Directory | Where-Object {Test-Path (Join-Path $_.FullName 'atlmfc')}).Count -gt 0}else{$false}
$taskReport=[ordered]@{timestamp=(Get-Date).ToUniversalTime().ToString('o');revision=$taskLock.tag;memoryGB=[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,1);freeDiskGB=[math]::Round((Get-PSDrive C).Free/1GB,1);visualStudio=@($taskVs | Select-Object installationPath,installationVersion);mfcAtlInstalled=$taskMfc;sdkInstalled=@($taskSdk);sdkRequired=$taskLock.windows.sdk;sdkReady=$taskSdkReady;debuggerVersion=$taskDebuggerVersion;debuggerReady=$taskDebuggerReady;nativeBuildReady=($taskSdkReady -and $taskMfc -and $taskDebuggerReady);note='Readiness also requires Chromium dependency sync and successful build hooks'}
$taskJson=$taskReport | ConvertTo-Json -Depth 5
if($ReportPath){$taskJson | Set-Content -LiteralPath $ReportPath -Encoding utf8}
$taskJson
