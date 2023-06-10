# Define the folder to zip and the destination path
$folderPath = "$($PSScriptRoot)\..\src"
$destinationPath = "$($PSScriptRoot)\packaged\package.zip"

# Check if the destination folder exists, and create it if necessary
if (-not (Test-Path -Path $destinationPath)) {
    New-Item -ItemType Directory -Path (Split-Path -Path $destinationPath)
}

# Check if the destination file already exists, and delete it if necessary
if (Test-Path -Path $destinationPath) {
    Remove-Item -Path $destinationPath
}

$items = Get-ChildItem $folderPath
Compress-Archive  $items -DestinationPath $destinationPath -Force
