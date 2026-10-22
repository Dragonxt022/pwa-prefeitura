#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Libera (ou remove) as portas do piloto no Windows Firewall, apenas para a sub-rede local.

.DESCRIPTION
  Por padrao detecta o perfil da rede ativa. Se a rede estiver classificada como Publica,
  a regra tambem vale para esse perfil (com aviso), pois e o caso comum de redes de escritorio.
  As regras sao limitadas a LocalSubnet: outros dispositivos da mesma rede, nao a internet.

.EXAMPLE
  .\scripts\liberar-firewall.ps1

.EXAMPLE
  .\scripts\liberar-firewall.ps1 -Perfil Private

.EXAMPLE
  .\scripts\liberar-firewall.ps1 -Remover
#>
[CmdletBinding()]
param(
  [int[]]$Portas = @(5173, 4173, 3000),
  [ValidateSet('Auto', 'Private', 'Public', 'Domain')]
  [string]$Perfil = 'Auto',
  [switch]$Remover
)

$prefixo = 'Prefeitura Digital - piloto (dev)'

if ($Remover) {
  $regras = Get-NetFirewallRule -DisplayName "$prefixo*" -ErrorAction SilentlyContinue
  if (-not $regras) {
    Write-Host 'Nenhuma regra do piloto encontrada.' -ForegroundColor Yellow
    return
  }
  $regras | Remove-NetFirewallRule
  Write-Host 'Regras removidas.' -ForegroundColor Yellow
  return
}

if ($Perfil -eq 'Auto') {
  $categorias = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty NetworkCategory -Unique)

  $perfis = @('Private')
  if ($categorias -contains 'Public') { $perfis += 'Public' }
  if ($categorias -contains 'DomainAuthenticated') { $perfis += 'Domain' }
} else {
  $perfis = @($Perfil)
}

if ($perfis -contains 'Public') {
  Write-Host 'Atencao: a rede ativa esta classificada como Publica.' -ForegroundColor Yellow
  Write-Host 'As regras valem para esse perfil, limitadas a LocalSubnet. Use apenas em rede confiavel' -ForegroundColor Yellow
  Write-Host 'e remova depois com: .\scripts\liberar-firewall.ps1 -Remover' -ForegroundColor Yellow
  Write-Host ''
}

foreach ($porta in $Portas) {
  $nome = "$prefixo - TCP $porta"

  $existente = Get-NetFirewallRule -DisplayName $nome -ErrorAction SilentlyContinue
  if ($existente) {
    $existente | Remove-NetFirewallRule
  }

  try {
    New-NetFirewallRule `
      -DisplayName $nome `
      -Direction Inbound `
      -Action Allow `
      -Protocol TCP `
      -LocalPort $porta `
      -Profile ($perfis -join ',') `
      -RemoteAddress LocalSubnet `
      -ErrorAction Stop | Out-Null

    Write-Host "Liberada: TCP $porta -> perfis $($perfis -join ', ') (LocalSubnet)" -ForegroundColor Green
  } catch {
    Write-Host "Falhou ao liberar TCP $porta : $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host 'Abra no celular o IP mostrado por: node scripts/ip-local.mjs 5173' -ForegroundColor Cyan
