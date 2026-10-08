Write-Host "Lancement de la procédure de déploiement automatisée sur Render..." -ForegroundColor Cyan

# Étape 1 : Vérification de Git
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Host "ERREUR : Git n'est pas installé. Veuillez installer Git avant de continuer." -ForegroundColor Red
    Pause
    Exit
}

# Étape 2 : Instructions pour le compte
Write-Host "==========================================================="
Write-Host "🚀 DÉPLOIEMENT DE API-PULSE"
Write-Host "==========================================================="
Write-Host "Votre projet (Frontend + Backend) est prêt à être hébergé."
Write-Host ""
Write-Host "1. Assurez-vous d'avoir poussé ce dossier sur votre compte GitHub."
Write-Host "2. Votre navigateur va s'ouvrir sur la page de connexion Render."
Write-Host "3. Connectez-vous avec GitHub et cliquez sur 'New Blueprint'."
Write-Host "==========================================================="
Write-Host ""
Write-Host "Appuyez sur Entrée pour ouvrir Render et finaliser le déploiement..." -ForegroundColor Yellow
Pause

# Ouvrir Render.com
Start-Process "https://dashboard.render.com/blueprints"

Write-Host "Félicitations, l'infrastructure As Code s'occupera du reste !" -ForegroundColor Green
Pause
