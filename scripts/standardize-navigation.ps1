# PowerShell script to standardize navigation and remove logo CSS overrides

$webPath = "c:\Users\iamal\OneDrive\Documents\GitHub\web"
$mainPages = @(
    "index.html",
    "audiobook.html", 
    "shop.html",
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
    "terms.html"
)

Write-Host "Standardizing navigation and logo sizing across all pages..."

foreach ($file in $mainPages) {
    $filePath = Join-Path $webPath $file
    if (Test-Path $filePath) {
        Write-Host "Processing $file..."
        $content = Get-Content $filePath -Raw
        
        # Remove embedded logo CSS that overrides external stylesheet
        $content = $content -replace '(?s)\/\* Responsive SVG Logo Styles \*\/.*?max-width: 220px;\s*}\s*}', ''
        
        # Remove any other embedded aleksfilmore-logo CSS blocks
        $content = $content -replace '(?s)\.aleksfilmore-logo[^{]*{[^}]*}', ''
        $content = $content -replace '(?s)\.aleksfilmore-logo-container[^{]*{[^}]*}', ''
        $content = $content -replace '(?s)\.aleksfilmore-logo-link[^{]*{[^}]*}', ''
        
        # Ensure logo.css is included after tailwind
        if ($content -notmatch 'logo\.css') {
            $content = $content -replace '(<link rel="stylesheet" href="/css/tailwind\.min\.css">)', "`$1`n    <link rel=""stylesheet"" href=""/css/logo.css"">"
        }
        
        Set-Content $filePath $content -NoNewline
        Write-Host "✓ Updated $file"
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host "`nNavigation standardization complete!"
Write-Host "All pages now use external logo.css for consistent sizing."
