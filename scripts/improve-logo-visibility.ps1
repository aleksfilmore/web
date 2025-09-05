# PowerShell script to update all logo SVGs with improved visibility

$webPath = "c:\Users\iamal\OneDrive\Documents\GitHub\web"
$files = @(
    "about.html",
    "bad-date-bingo.html", 
    "blog.html",
    "books.html",
    "checkout.html",
    "contact.html",
    "cookies.html",
    "dacia-rising.html",
    "newsletter.html",
    "privacy.html",
    "reviews.html",
    "terms.html",
    "templates\navigation.html"
)

# Old SVG pattern (smaller, less visible)
$oldSVG = '<text x="40" y="110" font-family="Space Grotesk, Arial, sans-serif" font-size="96" letter-spacing="4" fill="#F7F3ED">ALEKS FILMORE</text>' + "`n" +
          '                            <rect x="40" y="140" width="120" height="8" fill="#FF3B3B" rx="4"/>' + "`n" +
          '                            <text x="170" y="147" font-family="Inter, Arial, sans-serif" font-size="20" letter-spacing="9" fill="#F7F3ED">AUTHOR</text>'

# New SVG pattern (larger, more visible)
$newSVG = '<text x="40" y="110" font-family="Space Grotesk, Arial, sans-serif" font-size="96" letter-spacing="4" fill="#F7F3ED" font-weight="700">ALEKS FILMORE</text>' + "`n" +
          '                            <rect x="40" y="140" width="140" height="10" fill="#FF3B3B" rx="5"/>' + "`n" +
          '                            <text x="190" y="150" font-family="Inter, Arial, sans-serif" font-size="24" letter-spacing="8" fill="#F7F3ED" font-weight="600">AUTHOR</text>'

foreach ($file in $files) {
    $filePath = Join-Path $webPath $file
    if (Test-Path $filePath) {
        Write-Host "Updating $file..."
        $content = Get-Content $filePath -Raw
        $updatedContent = $content -replace [regex]::Escape($oldSVG), $newSVG
        
        if ($content -ne $updatedContent) {
            Set-Content $filePath $updatedContent -NoNewline
            Write-Host "✓ Updated $file"
        } else {
            Write-Host "→ No changes needed for $file"
        }
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host "`nLogo visibility improvements complete!"
