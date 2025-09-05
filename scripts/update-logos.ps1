# PowerShell script to update logo across all HTML files

$webPath = "c:\Users\iamal\OneDrive\Documents\GitHub\web"
$files = @(
    "blog.html",
    "books.html", 
    "contact.html",
    "cookies.html",
    "dacia-rising.html",
    "newsletter.html",
    "privacy.html",
    "reviews.html",
    "terms.html",
    "bad-date-bingo.html"
)

$oldLogoPattern = '                <!-- Brand Logo -->' + "`n" + 
                  '                <div class="font-display font-bold text-lg sm:text-xl">' + "`n" + 
                  '                    <a href="index.html" class="text-bone hover:text-red-flag transition-colors">Aleks Filmore</a>' + "`n" + 
                  '                </div>'

$newLogoPattern = '                <!-- Brand Logo -->' + "`n" + 
                  '                <div class="aleksfilmore-logo-container">' + "`n" + 
                  '                    <a href="index.html" class="aleksfilmore-logo-link">' + "`n" + 
                  '                        <!-- SVG Logo for Navigation -->' + "`n" + 
                  '                        <svg viewBox="0 0 1200 220" xmlns="http://www.w3.org/2000/svg" class="aleksfilmore-logo compact">' + "`n" + 
                  '                            <title>Aleks Filmore — Author</title>' + "`n" + 
                  '                            <text x="40" y="110" font-family="Space Grotesk, Arial, sans-serif" font-size="96" letter-spacing="4" fill="#F7F3ED">ALEKS FILMORE</text>' + "`n" + 
                  '                            <rect x="40" y="140" width="120" height="8" fill="#FF3B3B" rx="4"/>' + "`n" + 
                  '                            <text x="170" y="147" font-family="Inter, Arial, sans-serif" font-size="20" letter-spacing="9" fill="#F7F3ED">AUTHOR</text>' + "`n" + 
                  '                        </svg>' + "`n" + 
                  '                    </a>' + "`n" + 
                  '                </div>'

foreach ($file in $files) {
    $filePath = Join-Path $webPath $file
    if (Test-Path $filePath) {
        Write-Host "Updating $file..."
        $content = Get-Content $filePath -Raw
        $updatedContent = $content -replace [regex]::Escape($oldLogoPattern), $newLogoPattern
        Set-Content $filePath $updatedContent -NoNewline
        Write-Host "✓ Updated $file"
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host "`nLogo update complete!"
