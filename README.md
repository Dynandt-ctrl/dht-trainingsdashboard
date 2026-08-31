# DHT Trainingsdashboard

Standalone versie van je trainingsdashboard, klaar om te deployen op Vercel.

## Belangrijk: opslag werkt anders

In Claude werd je data opgeslagen via Claude's eigen opslagsysteem. Deze versie
gebruikt in plaats daarvan `localStorage` in je browser. Dat betekent:

- Je data blijft bewaard zolang je dezelfde browser op hetzelfde apparaat gebruikt.
- Data wordt **niet** gesynchroniseerd tussen je telefoon en laptop.
- Als je browsergegevens wist (of incognito gebruikt), ben je je data kwijt.
- Je eerder in Claude gelogde trainingen staan hier nog niet in — dit is een
  schone start.

## Deployen op Vercel (geen command line nodig)

1. Maak (gratis) een account op [github.com](https://github.com) als je die nog
   niet hebt.
2. Maak een nieuwe, lege repository aan, bijv. `dht-trainingsdashboard`.
3. Upload alle bestanden uit deze map naar die repository (via "Add file" →
   "Upload files" op GitHub, of via `git push` als je dat kent).
4. Ga naar [vercel.com](https://vercel.com) en log in met je GitHub-account.
5. Klik **"Add New..." → "Project"**, kies je zojuist geüploade repository.
6. Vercel herkent automatisch dat dit een Vite-project is — je hoeft niets
   aan te passen. Klik **Deploy**.
7. Na ongeveer een minuut krijg je een live link, bijv.
   `dht-trainingsdashboard.vercel.app`. Zet die op je startscherm en je hebt
   een app-achtige snelkoppeling.

## Alternatief: via de command line (als je Node.js hebt)

```bash
npm install
npx vercel
```

Volg de instructies in het terminalvenster (inloggen via Vercel gebeurt in je
eigen browser, ik doe dit niet voor je).

## Lokaal testen

```bash
npm install
npm run dev
```

Open daarna de link die in je terminal verschijnt (meestal
`http://localhost:5173`).
