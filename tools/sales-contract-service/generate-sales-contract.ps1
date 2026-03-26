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

  try {
    $range = $Table.Cell($Row, $Column).Range
    $range.End = $range.End - 1
    $range.Text = [string]$Value
  } catch {
    return
  }
}

if (!(Test-Path -LiteralPath $TemplatePath)) {
  throw "DOC template topilmadi: $TemplatePath"
}

if (!(Test-Path -LiteralPath $PayloadPath)) {
  throw "Payload topilmadi: $PayloadPath"
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
      Find = 'Boqijonov Umidjon Baxromjon O?g?libilan 2025 yil "20" oktyabrda tuzilgan ? 2010011-sonli shartnomaning to?lov muddati grafigi'
      Replace = "$($payload.fullName) bilan $($payload.contractDateText)da tuzilgan $contractNoSign $($payload.contractNumber)-sonli shartnomaning to'lov muddati grafigi"
      Wildcards = $true
    },
    @{
      Find = '2025 yil "20" oktyabr'
      Replace = [string]$payload.contractDateText
    },
    @{
      Find = '2010011'
      Replace = [string]$payload.contractNumber
    },
    @{
      Find = 'Boqijonov Umidjon Baxromjon O?g?li'
      Replace = [string]$payload.fullName
      Wildcards = $true
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
      Find = 'FARG’ONA VILOYATI QO‘SHTEPA TUMANI IIB'
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

  $contractNumberParagraph = Get-ParagraphRange -Document $document -FindText 'Shartnoma ?' -Wildcards
  $contractDateParagraph = Get-ParagraphRange -Document $document -FindText 'Marg`ilon shahar'
  $scheduleTitleParagraph = Get-ParagraphRange -Document $document -FindText 'grafigi'

  if ($null -ne $contractNumberParagraph) {
    Format-WordText -Range $contractNumberParagraph -FindText ([string]$payload.contractNumber) -Bold $true -Size 10.5
  }

  if ($null -ne $contractDateParagraph) {
    Format-WordText -Range $contractDateParagraph -FindText ([string]$payload.contractDateText) -Bold $true -Size 10
  }

  $priceParagraph = Find-FirstRange -Range $content -FindText ([string]$payload.pricePerMeterUsdLabel)
  if ($null -ne $priceParagraph) {
    $priceParagraph.Font.Bold = -1
    $priceParagraph.Font.Size = 11
  }

  $totalAmountText = "$($payload.totalUsdLabel) ($($payload.totalUsdWords))"
  $totalAmountRange = Find-FirstRange -Range $content -FindText $totalAmountText
  if ($null -ne $totalAmountRange) {
    $totalAmountRange.Font.Bold = -1
    $totalAmountRange.Font.Size = 11
  }

  $contentFormattingTargets = @(
    @{ Text = [string]$payload.shortName; Bold = $true; Size = 12 },
    @{ Text = [string]$payload.birthDate; Bold = $true; Size = 12 },
    @{ Text = [string]$payload.passportNumber; Bold = $true; Size = 12 },
    @{ Text = [string]$payload.passportIssuedBy; Bold = $true; Size = 12 },
    @{ Text = [string]$payload.passportIssuedDate; Bold = $true; Size = 12 },
    @{ Text = [string]$payload.phone; Bold = $true; Size = 12 },
    @{ Text = [string]$payload.address; Bold = $true; Size = 12 }
  )

  foreach ($formatTarget in $contentFormattingTargets) {
    $targetRange = Find-FirstRange -Range $content -FindText $formatTarget.Text
    if ($null -eq $targetRange) {
      continue
    }

    if ($null -ne $formatTarget.Bold) {
      $targetRange.Font.Bold = [int][bool]$formatTarget.Bold * -1
    }

    if ($null -ne $formatTarget.Size) {
      $targetRange.Font.Size = [double]$formatTarget.Size
    }
  }

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
