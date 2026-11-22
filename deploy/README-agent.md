# Déployer le service IA (assistant)

Le script `deploy.ps1` déploie le **site PHP + le front**. L'assistant ajoute une
pièce que le script ne gère pas : un **service Node** (`ai/agent`) qui tourne en
permanence sur le serveur, en local (`127.0.0.1:8787`). Le PHP lui parle en
interne ; la clé API ne quitte jamais le serveur.

```
navigateur ─▶ Symfony (/api/nba/*) ─▶ service Node 127.0.0.1:8787 ─▶ MCP ─▶ NBA
```

## Mise en place (une seule fois, sur le serveur)

Prérequis : **Node 18+** installé sur le serveur (`node -v`).

```bash
cd /var/www/balldontlie

# 1. Builder le serveur MCP puis l'agent
cd ai/mcp-server && npm ci && npm run build && cd -
cd ai/agent     && npm ci && npm run build && cd -

# 2. La clé : le service lit ANTHROPIC_API_KEY depuis le .env du projet
grep -q '^ANTHROPIC_API_KEY=' .env && echo "clé présente" || echo "AJOUTER ANTHROPIC_API_KEY au .env"

# 3. Installer le service systemd (adapter les chemins dans le fichier au besoin)
sudo cp deploy/nba-agent.service /etc/systemd/system/nba-agent.service
sudo systemctl daemon-reload
sudo systemctl enable --now nba-agent

# 4. Vérifier
curl -s http://127.0.0.1:8787/health      # -> {"ok":true,"tools":9,"credentials":true}
```

## À chaque déploiement

`deploy.ps1` s'en charge : son étape 4/4 rebuild le serveur MCP + l'agent et
redémarre le service (`$DeployAgent = $true` par défaut). Rien à faire à la main.

Si tu déploies sans le script, l'équivalent manuel sur le serveur est :

```bash
cd /var/www/balldontlie/ai/mcp-server && npm ci && npm run build
cd /var/www/balldontlie/ai/agent && npm ci && npm run build
sudo systemctl restart nba-agent
```

## Config côté PHP (optionnel)

Le proxy Symfony vise `http://127.0.0.1:8787` par défaut. Pour changer le port
ou l'hôte, définir dans `.env` :

```
NBA_AGENT_URL=http://127.0.0.1:8787
```

## ⚠️ Accès aux données NBA depuis la prod

L'agent appelle `stats.nba.com` / `cdn.nba.com`, **comme le PHP**. Si l'IP du
serveur est bloquée par Akamai (le souci vu sur la home), l'assistant ne pourra
pas répondre aux questions qui dépendent de données du soir, et les avant-matchs
échoueront. À valider sur le serveur avant de compter dessus :

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -H "Referer: https://www.nba.com/" \
  "https://stats.nba.com/stats/scoreboardv3?GameDate=2026-11-21&LeagueID=00"
```

Si ça renvoie 403, c'est le même blocage IP — à régler indépendamment (source de
données alternative, ou cache du calendrier rafraîchi depuis une IP non bloquée).
