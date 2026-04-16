Add-Type -AssemblyName System.Drawing
$src = (Resolve-Path 'assets/img/logo_agenda.png').Path
$dst = (Resolve-Path 'assets/img').Path + '\logo_agenda_real.png'
$img = [System.Drawing.Image]::FromFile($src)
$img.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "OK - saved to $dst"
