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

foreach ($file in $files) {
    $filePath = Join-Path $webPath $file
    if (Test-Path $filePath) {
        Write-Host "Updating $file..."
        $content = Get-Content $filePath -Raw
        
        # Replace old logo SVG with new improved version
        $content = $content -replace 'font-size="96" letter-spacing="4" fill="#F7F3ED">', 'font-size="96" letter-spacing="4" fill="#F7F3ED" font-weight="700">'
        $content = $content -replace 'width="120" height="8"', 'width="140" height="10"'
        $content = $content -replace 'font-size="20" letter-spacing="9"', 'font-size="24" letter-spacing="8" font-weight="600"'
        $content = $content -replace 'x="170" y="147"', 'x="190" y="150"'
        $content = $content -replace 'rx="4"', 'rx="5"'
        
        Set-Content $filePath $content -NoNewline
        Write-Host "Updated $file successfully"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "Logo visibility improvements complete!"
