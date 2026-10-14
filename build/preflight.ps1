param([string]$ReportPath,[string]$Release)
$ErrorActionPreference='Stop'
$taskProjectRoot=Split-Path $PSScriptRoot -Parent
if($Release -and $Release -notmatch '^\d+\.\d+\.\d+\.\d+$'){throw 'Release must be an exact Chromium version'}
$taskLockPath=if($Release){Join-Path $taskProjectRoot ('engine/releases/'+$Release+'/upstream.lock.json')}else{Join-Path $taskProjectRoot 'engine/upstream.lock.json'}
$taskLock=Get-Content -LiteralPath $taskLockPath -Raw | ConvertFrom-Json
$taskVswhere='C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe'
$taskVs=if(Test-Path $taskVswhere){& $taskVswhere -latest -products '*' -format json | ConvertFrom-Json}else{@()}
$taskSdk=Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName -match '^Windows Software Development Kit'} | Select-Object DisplayName,DisplayVersion
$taskSdkMinimum=[version]$taskLock.windows.sdk
$taskSdkProductMinimum=[version]('10.1.'+$taskSdkMinimum.Build+'.'+$taskSdkMinimum.Revision)
$taskSdkHeaders=Join-Path 'C:\Program Files (x86)\Windows Kits\10\Include' ('10.0.'+$taskSdkMinimum.Build+'.0\um\windows.h')
$taskSdkLibrary=Join-Path 'C:\Program Files (x86)\Windows Kits\10\Lib' ('10.0.'+$taskSdkMinimum.Build+'.0\um\x64\kernel32.lib')
$taskSdkReady=(@($taskSdk | Where-Object {[version]$_.DisplayVersion -ge $taskSdkProductMinimum}).Count -gt 0 -and (Test-Path -LiteralPath $taskSdkHeaders) -and (Test-Path -LiteralPath $taskSdkLibrary))
$taskVsReady=($taskVs -and [version]$taskVs.installationVersion -ge [version]$taskLock.windows.visualStudioMinimum)
$taskDebugger='C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\dbghelp.dll'
$taskDebuggerVersion=if(Test-Path $taskDebugger){(Get-Item $taskDebugger).VersionInfo.FileVersion}else{'missing'}
$taskDebuggerMinimum=if($taskLock.windows.debuggerMinimum){[version]$taskLock.windows.debuggerMinimum}else{[version]'10.0.26100.3323'}
$taskDebuggerReady=if(Test-Path $taskDebugger){(Get-Item $taskDebugger).VersionInfo.FileVersionRaw -ge $taskDebuggerMinimum}else{$false}
$taskMfc=if($taskVs -and (Test-Path (Join-Path $taskVs.installationPath 'VC\Tools\MSVC'))){@(Get-ChildItem (Join-Path $taskVs.installationPath 'VC\Tools\MSVC') -Directory | Where-Object {Test-Path (Join-Path $_.FullName 'atlmfc')}).Count -gt 0}else{$false}
$taskFreeDiskGB=[math]::Round((Get-PSDrive C).Free/1GB,1)
$taskReport=[ordered]@{timestamp=(Get-Date).ToUniversalTime().ToString('o');revision=$taskLock.tag;memoryGB=[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,1);freeDiskGB=$taskFreeDiskGB;visualStudio=@($taskVs | Select-Object installationPath,installationVersion);visualStudioRequired=$taskLock.windows.visualStudioMinimum;visualStudioReady=$taskVsReady;mfcAtlInstalled=$taskMfc;sdkInstalled=@($taskSdk);sdkRequired=$taskLock.windows.sdk;sdkReady=$taskSdkReady;debuggerVersion=$taskDebuggerVersion;debuggerReady=$taskDebuggerReady;nativeBuildReady=($taskVsReady -and $taskSdkReady -and $taskMfc -and $taskDebuggerReady -and $taskFreeDiskGB -ge $taskLock.windows.freeDiskGBMinimum);note='Readiness also requires Chromium dependency sync and successful build hooks'}
$taskJson=$taskReport | ConvertTo-Json -Depth 5
if($ReportPath){$taskJson | Set-Content -LiteralPath $ReportPath -Encoding utf8}
$taskJson
