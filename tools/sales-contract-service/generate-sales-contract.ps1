param(
  [Parameter(Mandatory = $true)]
  [string]$TemplatePath,

  [Parameter(Mandatory = $true)]
  [string]$PayloadPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
function Replace-WordText {
  param(
    [Parameter(Mandatory = $true)]
    $Range,

    [Parameter(Mandatory = $true)]
    [string]$FindText,

    [Parameter(Mandatory = $true)]
    [string]$ReplaceText,

    [switch]$Wildcards
  )

  if ([string]::IsNullOrWhiteSpace($FindText)) {
    return
  }

  $find = $Range.Find
  $find.ClearFormatting()
  $find.Replacement.ClearFormatting()
  $null = $find.Execute(
    $FindText,
    $false,
    $false,
    $Wildcards.IsPresent,
    $false,
    $false,
    $true,
    1,
    $false,
    $ReplaceText,
    2
  )
}

function Get-AllStoryRanges {
  param(
    [Parameter(Mandatory = $true)]
    $Document
  )

  $ranges = @()
  foreach ($root in $Document.StoryRanges) {
    $story = $root
    while ($null -ne $story) {
      $ranges += $story
      $story = $story.NextStoryRange
    }
  }

  return $ranges
}

function Replace-WordTextInDocument {
  param(
    [Parameter(Mandatory = $true)]
    $Document,

    [Parameter(Mandatory = $true)]
    [string]$FindText,

    [Parameter(Mandatory = $true)]
    [string]$ReplaceText,

    [switch]$Wildcards
  )

  $storyRanges = Get-AllStoryRanges -Document $Document
  foreach ($storyRange in $storyRanges) {
    Replace-WordText `
      -Range $storyRange `
      -FindText $FindText `
      -ReplaceText $ReplaceText `
      -Wildcards:([bool]$Wildcards)
  }
}

function Replace-ValueAfterLabelInRange {
  param(
    [Parameter(Mandatory = $true)]
    $Range,

    [Parameter(Mandatory = $true)]
    [string]$Label,

    [Parameter(Mandatory = $true)]
    [string]$Value,

    [Nullable[bool]]$Bold = $null,

    [Nullable[double]]$Size = $null,

    [int]$MaxMatches = 2
  )

  if ([string]::IsNullOrWhiteSpace($Label)) {
    return
  }

  $scopeEnd = $Range.End
  $searchRange = $Range.Duplicate
  $matchCount = 0

  while ($searchRange.Start -lt $scopeEnd -and $matchCount -lt $MaxMatches) {
    $find = $searchRange.Find
    $find.ClearFormatting()
    $find.Text = $Label
    $find.Forward = $true
    $find.Wrap = 0

    $found = $find.Execute(
      $Label,
      $false,
      $false,
      $false,
      $false,
      $false,
      $true,
      1,
      $false
    )

    if (!$found) {
      break
    }

    $paragraphRange = $searchRange.Paragraphs.Item(1).Range
    $valueRange = $paragraphRange.Duplicate
    $valueRange.Start = $searchRange.End
    $valueRange.End = $paragraphRange.End - 1

    if ($valueRange.End -lt $valueRange.Start) {
      $valueRange.SetRange($searchRange.End, $searchRange.End)
    }

    $valueRange.Text = " $Value"

    if ($null -ne $Bold) {
      $valueRange.Font.Bold = [int][bool]$Bold * -1
    }

    if ($null -ne $Size) {
      $valueRange.Font.Size = [double]$Size
    }

    $matchCount += 1

    $scopeEnd = $Range.End
    $searchRange.SetRange($paragraphRange.End, $scopeEnd)
  }
}

function Replace-ValueAfterLabelsInDocument {
  param(
    [Parameter(Mandatory = $true)]
    $Document,

    [Parameter(Mandatory = $true)]
    [string[]]$Labels,

    [Parameter(Mandatory = $true)]
    [string]$Value,

    [Nullable[bool]]$Bold = $null,

    [Nullable[double]]$Size = $null
  )

  if ($null -eq $Labels -or $Labels.Count -eq 0) {
    return
  }

  $storyRanges = Get-AllStoryRanges -Document $Document
  foreach ($storyRange in $storyRanges) {
    foreach ($label in $Labels) {
      Replace-ValueAfterLabelInRange `
        -Range $storyRange `
        -Label $label `
        -Value $Value `
        -Bold $Bold `
        -Size $Size
    }
  }
}

function DocumentContainsText {
  param(
    [Parameter(Mandatory = $true)]
    $Document,

    [Parameter(Mandatory = $true)]
    [string]$Text
  )

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $false
  }

  $storyRanges = Get-AllStoryRanges -Document $Document
  foreach ($storyRange in $storyRanges) {
    if ([string]$storyRange.Text -like "*$Text*") {
      return $true
    }
  }

  return $false
}

function StoryRangesContainText {
  param(
    [Parameter(Mandatory = $true)]
    $StoryRanges,

    [Parameter(Mandatory = $true)]
    [string]$Text
  )

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $false
  }

  foreach ($storyRange in $storyRanges) {
    if ([string]$storyRange.Text -like "*$Text*") {
      return $true
    }
  }

  return $false
}

function Find-FirstRange {
  param(
    [Parameter(Mandatory = $true)]
    $Range,

    [Parameter(Mandatory = $true)]
    [string]$FindText,

    [switch]$Wildcards
  )

  $searchRange = $Range.Duplicate
  $find = $searchRange.Find
  $find.ClearFormatting()
  $find.Text = $FindText
  $find.Forward = $true
  $find.Wrap = 0

  if ($find.Execute(
      $FindText,
      $false,
      $false,
      $Wildcards.IsPresent,
      $false,
      $false,
      $true,
      1,
      $false
    )) {
    return $searchRange
  }

  return $null
}

function Format-WordText {
  param(
    [Parameter(Mandatory = $true)]
    $Range,

    [Parameter(Mandatory = $true)]
    [string]$FindText,

    [Nullable[bool]]$Bold = $null,

    [Nullable[double]]$Size = $null,

    [switch]$Wildcards
  )

  $scopeEnd = $Range.End
  $searchRange = $Range.Duplicate

  while ($searchRange.Start -lt $scopeEnd) {
    $find = $searchRange.Find
    $find.ClearFormatting()
    $find.Text = $FindText
    $find.Forward = $true
    $find.Wrap = 0

    $found = $find.Execute(
      $FindText,
      $false,
      $false,
      $Wildcards.IsPresent,
      $false,
      $false,
      $true,
      1,
      $false
    )

    if (!$found) {
      break
    }

    if ($null -ne $Bold) {
      $searchRange.Font.Bold = [int][bool]$Bold * -1
    }

    if ($null -ne $Size) {
      $searchRange.Font.Size = [double]$Size
    }

    $nextStart = $searchRange.End
    if ($nextStart -ge $scopeEnd) {
      break
    }

    $searchRange.SetRange($nextStart, $scopeEnd)
  }
}

function Get-ParagraphRange {
  param(
    [Parameter(Mandatory = $true)]
    $Document,

    [Parameter(Mandatory = $true)]
    [string]$FindText,

    [switch]$Wildcards
  )

  $foundRange = Find-FirstRange -Range $Document.Content -FindText $FindText -Wildcards:([bool]$Wildcards)
  if ($null -eq $foundRange) {
    return $null
  }

  return $foundRange.Paragraphs.Item(1).Range
}

function Set-TableCellText {
  param(
    [Parameter(Mandatory = $true)]
    $Table,

    [Parameter(Mandatory = $true)]
    [int]$Row,

    [Parameter(Mandatory = $true)]
    [int]$Column,

    [AllowEmptyString()]
    [string]$Value
  )

  $range = $Table.Cell($Row, $Column).Range
  $range.End = $range.End - 1
  $range.Text = [string]$Value
}

if (!(Test-Path -LiteralPath $TemplatePath)) {
  throw "DOC template topilmadi: $TemplatePath"
}

if (!(Test-Path -LiteralPath $PayloadPath)) {
  throw "Payload topilmadi: $PayloadPath"
}

try {
  $orphanThreshold = (Get-Date).AddMinutes(-2)
  Get-Process -Name WINWORD -ErrorAction SilentlyContinue |
    Where-Object {
      $_.MainWindowHandle -eq 0 -and $_.StartTime -lt $orphanThreshold
    } |
    ForEach-Object {
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
} catch {
  # Cleanup fail bo'lsa generatsiyani to'xtatmaymiz.
}

$payload = Get-Content -LiteralPath $PayloadPath -Raw -Encoding UTF8 | ConvertFrom-Json
$scheduleRows = @($payload.schedule)
$contractNoSign = [string]([char]0x2116)
$workingPath = Join-Path (
  [System.IO.Path]::GetDirectoryName($OutputPath)
) ("sales-contract-working-{0}.doc" -f [guid]::NewGuid().ToString("N"))
$word = $null
$document = $null

try {
  Copy-Item -LiteralPath $TemplatePath -Destination $workingPath -Force

  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $word.ScreenUpdating = $false
  $word.Options.Pagination = $false

  $document = $word.Documents.Open($workingPath, $false, $false)
  $content = $document.Content

  $replacements = @(
    @{
      Find = '2025 yil "20" oktyabr'
      Replace = [string]$payload.contractDateText
    },
    @{
      Find = '2010011'
      Replace = [string]$payload.contractNumber
    },
    @{
      Find = "Boqijonov Umidjon Baxromjon O‘g‘li"
      Replace = [string]$payload.fullName
    },
    @{
      Find = 'Boqijonov Umidjon Baxromjon O''g''li'
      Replace = [string]$payload.fullName
    },
    @{
      Find = 'Boqijonov Umidjon Baxromjon O?g?li'
      Replace = [string]$payload.fullName
    },
    @{
      Find = 'Boqijonov Umidjon'
      Replace = [string]$payload.shortName
    },
    @{
      Find = '2003-06-02'
      Replace = [string]$payload.birthDate
    },
    @{
      Find = 'AC 2521090'
      Replace = [string]$payload.passportNumber
    },
    @{
      Find = "FARG’ONA VILOYATI QO‘SHTEPA TUMANI IIB"
      Replace = [string]$payload.passportIssuedBy
    },
    @{
      Find = 'FARG''ONA VILOYATI QO''SHTEPA TUMANI IIB'
      Replace = [string]$payload.passportIssuedBy
    },
    @{
      Find = '2019-12-09'
      Replace = [string]$payload.passportIssuedDate
    },
    @{
      Find = '+998936611610'
      Replace = [string]$payload.phone
    },
    @{
      Find = 'Фаргона viloyati, ҚУМТЕПА МФЙ, ЛАТИФ КЎЧАСИ,  uy:187'
      Replace = [string]$payload.address
    },
    @{
      Find = 'Фаргона viloyati ҚУМТЕПА МФЙ, ЛАТИФ КЎЧАСИ,  uy:187'
      Replace = [string]$payload.address
    },
    @{
      Find = '11-blok'
      Replace = [string]$payload.blockLabel
    },
    @{
      Find = '11 - qavati'
      Replace = "$($payload.floorNumber) - qavati"
    },
    @{
      Find = '76 - xonasi'
      Replace = "$($payload.houseNumber) - xonasi"
    },
    @{
      Find = '2- xonali'
      Replace = "$($payload.roomCount)- xonali"
    },
    @{
      Find = '54.19'
      Replace = [string]$payload.sizeLabel
    },
    @{
      Find = '(turar-joy/tijorat)'
      Replace = "($($payload.propertyTypeUz))"
    },
    @{
      Find = '580 (AQSh dollari)'
      Replace = "$($payload.pricePerMeterUsdLabel) (AQSh dollari)"
    },
    @{
      Find = '31 430 (Uch million bir yuz qirq uch ming) (AQSh dollari)'
      Replace = "$($payload.totalUsdLabel) ($($payload.totalUsdWords)) (AQSh dollari)"
    }
  )

  foreach ($item in $replacements) {
    Replace-WordText `
      -Range $content `
      -FindText $item.Find `
      -ReplaceText $item.Replace `
      -Wildcards:([bool]$item.Wildcards)
  }

  Replace-WordText `
    -Range $content `
    -FindText "$($payload.fullName)bilan" `
    -ReplaceText "$($payload.fullName) bilan"

  $labelDrivenFields = @(
    @{ Labels = @("Ism-familiya:"); Value = [string]$payload.shortName; Bold = $true; Size = 12 },
    @{ Labels = @("Tug'ilgansanasi:", "Tug'ilgan sanasi:"); Value = [string]$payload.birthDate; Bold = $true; Size = 12 },
    @{ Labels = @("Passportraqami:", "Passport raqami:"); Value = [string]$payload.passportNumber; Bold = $true; Size = 12 },
    @{ Labels = @("Kimtomondanberilgan:", "Kim tomonidan berilgan:"); Value = [string]$payload.passportIssuedBy; Bold = $true; Size = 12 },
    @{ Labels = @("Berilgansana:", "Berilgan sana:"); Value = [string]$payload.passportIssuedDate; Bold = $true; Size = 12 },
    @{ Labels = @("Telefon:"); Value = [string]$payload.phone; Bold = $true; Size = 12 },
    @{ Labels = @("Manzili:", "Manzil:"); Value = [string]$payload.address; Bold = $true; Size = 12 }
  )

  foreach ($field in $labelDrivenFields) {
    foreach ($label in $field.Labels) {
      Replace-ValueAfterLabelInRange `
        -Range $content `
        -Label $label `
        -Value $field.Value `
        -Bold $field.Bold `
        -Size $field.Size
    }
  }

  $contentText = [string]$content.Text
  $legacyMarkers = @('2003-06-02', 'AC 2521090', '+998936611610', 'uy:187')
  foreach ($legacy in $legacyMarkers) {
    if ($contentText -like "*$legacy*") {
      throw "Template ichida eski qiymat qolib ketdi: $legacy"
    }
  }

  $scheduleTitleParagraph = Get-ParagraphRange -Document $document -FindText 'grafigi'

  $paymentTable = $document.Tables.Item(2)

  Set-TableCellText -Table $paymentTable -Row 1 -Column 1 -Value '3'
  Set-TableCellText -Table $paymentTable -Row 1 -Column 2 -Value 'Shartnoma summasi'
  Set-TableCellText -Table $paymentTable -Row 1 -Column 3 -Value ([string]$payload.totalSomLabel)

  Set-TableCellText -Table $paymentTable -Row 2 -Column 1 -Value '1'
  Set-TableCellText -Table $paymentTable -Row 2 -Column 2 -Value "Boshlang'ich to'lov"
  Set-TableCellText -Table $paymentTable -Row 2 -Column 3 -Value ([string]$payload.downPaymentLabel)

  Set-TableCellText -Table $paymentTable -Row 3 -Column 1 -Value '2'
  Set-TableCellText -Table $paymentTable -Row 3 -Column 2 -Value "To'lashga qoldi"
  Set-TableCellText -Table $paymentTable -Row 3 -Column 3 -Value ([string]$payload.remainingAmountLabel)

  Set-TableCellText -Table $paymentTable -Row 4 -Column 1 -Value ''
  Set-TableCellText -Table $paymentTable -Row 4 -Column 2 -Value 'Sana'
  Set-TableCellText -Table $paymentTable -Row 4 -Column 3 -Value "Oylik to'lov"
  Set-TableCellText -Table $paymentTable -Row 4 -Column 4 -Value 'Qoldiq'

  for ($rowIndex = 0; $rowIndex -lt 60; $rowIndex++) {
    $tableRow = $rowIndex + 5
    $scheduleRow = if ($rowIndex -lt $scheduleRows.Count) { $scheduleRows[$rowIndex] } else { $null }
    if ($null -eq $scheduleRow) {
      Set-TableCellText -Table $paymentTable -Row $tableRow -Column 1 -Value ''
      Set-TableCellText -Table $paymentTable -Row $tableRow -Column 2 -Value ''
      Set-TableCellText -Table $paymentTable -Row $tableRow -Column 3 -Value ''
      Set-TableCellText -Table $paymentTable -Row $tableRow -Column 4 -Value ''
      continue
    }

    Set-TableCellText -Table $paymentTable -Row $tableRow -Column 1 -Value ([string]$scheduleRow.number)
    Set-TableCellText -Table $paymentTable -Row $tableRow -Column 2 -Value ([string]$scheduleRow.date)
    Set-TableCellText -Table $paymentTable -Row $tableRow -Column 3 -Value ([string]$scheduleRow.payment)
    Set-TableCellText -Table $paymentTable -Row $tableRow -Column 4 -Value ([string]$scheduleRow.balance)
  }
  if ($null -ne $scheduleTitleParagraph) {
    $scheduleTitleParagraph.Font.Bold = -1
    $scheduleTitleParagraph.Font.Size = 8
  }

  $document.ExportAsFixedFormat($OutputPath, 17)

  if (!(Test-Path -LiteralPath $OutputPath)) {
    throw "PDF export natijasi topilmadi."
  }
} finally {
  if ($document) {
    $document.Close($false)
  }
  if ($word) {
    $word.Quit()
  }

  foreach ($comObject in @($document, $word)) {
    if ($null -ne $comObject) {
      [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($comObject)
    }
  }

  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()

  if (Test-Path -LiteralPath $workingPath) {
    Remove-Item -LiteralPath $workingPath -Force -ErrorAction SilentlyContinue
  }
}

