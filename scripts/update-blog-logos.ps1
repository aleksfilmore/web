# PowerShell script to add improved logos to blog pages

$webPath = "c:\Users\iamal\OneDrive\Documents\GitHub\web"
$blogFiles = @(
    "blog\why-i-stopped-dating-apps.html",
    "blog\red-flag-field-guide.html", 
    "blog\anatomy-of-a-ghost.html",
    "blog\how-i-got-into-writing-the-worst-boyfriends-ever.html"
)

# Old text branding pattern
$oldBranding = '                <div class="font-display font-bold text-lg sm:text-xl">
                    <a href="../index.html" class="text-bone hover:text-red-flag transition-colors">Aleks Filmore</a>
                </div>'

# New SVG logo with improved visibility
$newLogo = '                <!-- Brand Logo -->
                <div class="aleksfilmore-logo-container">
                    <a href="../index.html" class="aleksfilmore-logo-link">
                        <!-- SVG Logo for Navigation -->
                        <svg viewBox="0 0 1200 220" xmlns="http://www.w3.org/2000/svg" class="aleksfilmore-logo compact">
                            <title>Aleks Filmore — Author</title>
                            <text x="40" y="110" font-family="Space Grotesk, Arial, sans-serif" font-size="96" letter-spacing="4" fill="#F7F3ED" font-weight="700">ALEKS FILMORE</text>
                            <rect x="40" y="140" width="140" height="10" fill="#FF3B3B" rx="5"/>
                            <text x="190" y="150" font-family="Inter, Arial, sans-serif" font-size="24" letter-spacing="8" fill="#F7F3ED" font-weight="600">AUTHOR</text>
                        </svg>
                    </a>
                </div>'

# CSS styles to add to each blog file  
$logoCSS = '    <link rel="stylesheet" href="/css/logo.css">'

foreach ($file in $blogFiles) {
    $filePath = Join-Path $webPath $file
    if (Test-Path $filePath) {
        Write-Host "Updating $file..."
        $content = Get-Content $filePath -Raw
        
        # Add logo CSS after tailwind.min.css
        if ($content -match '(\s*<link rel="stylesheet" href="/css/tailwind\.min\.css">)') {
            $content = $content -replace '(\s*<link rel="stylesheet" href="/css/tailwind\.min\.css">)', "`$1`n$logoCSS"
        }
        
        # Replace text branding with SVG logo
        $content = $content -replace [regex]::Escape($oldBranding), $newLogo
        
        Set-Content $filePath $content -NoNewline
        Write-Host "Updated $file successfully"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "Blog logo updates complete!"
