git status --porcelain | ForEach-Object {
    $file = $_.Substring(3)   # pega o caminho do arquivo (coluna 2)
    git add "$file"
    git commit -m "chore: update $file"
}
git push origin main
