# PowerShell script to remove embedded logo CSS overrides

$webPath = "c:\Users\iamal\OneDrive\Documents\GitHub\web"
$mainPages = @(
    "index.html",
    "audiobook.html", 
    "shop.html"
)

Write-Host "Removing embedded logo CSS from key pages..."

foreach ($file in $mainPages) {
    $filePath = Join-Path $webPath $file
    if (Test-Path $filePath) {
        Write-Host "Processing $file..."
        $content = Get-Content $filePath -Raw
        
        # Remove the specific embedded logo CSS blocks
        $content = $content -replace '        \/\* Responsive SVG Logo Styles \*\/.*?        }', '', [System.Text.RegularExpressions.RegexOptions]::Singleline
        $content = $content -replace '        \.aleksfilmore-logo-container \{.*?\s*        }', '', [System.Text.RegularExpressions.RegexOptions]::Singleline
        $content = $content -replace '        \.aleksfilmore-logo-link \{.*?\s*        }', '', [System.Text.RegularExpressions.RegexOptions]::Singleline  
        $content = $content -replace '        \.aleksfilmore-logo \{.*?\s*        }', '', [System.Text.RegularExpressions.RegexOptions]::Singleline
        $content = $content -replace '@media \(min-width: 640px\) \{.*?aleksfilmore-logo.*?\s*        }.*?\s*    }', '', [System.Text.RegularExpressions.RegexOptions]::Singleline
        
        Set-Content $filePath $content -NoNewline
        Write-Host "Updated $file successfully"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "Embedded CSS removal complete!"
