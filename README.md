## AVENIR Bank

### Démarrage (Docker)

```bash
docker compose up -d --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### Comptes seed (démo)

Au démarrage, le backend exécute automatiquement un seed idempotent (création si absents).

- Director: `director@avenir.test` / `Director123!`
- Advisor: `advisor@avenir.test` / `Advisor123!`
- Client 1: `client1@avenir.test` / `Client123!`
- Client 2: `client2@avenir.test` / `Client123!`

Le seed crée aussi des **actions** de démo (AVA / NEO / SOL) pour tester la partie investissement.

Si besoin, vous pouvez relancer manuellement:

```bash
docker exec avenirbank-backend npm run seed
```

Génération rapide (dans `backend/`):

```bash
npx web-push generate-vapid-keys
```

Configuration (Docker Compose):

1) Créez un fichier `.env` à la racine
2) Collez les valeurs `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`
3) Redémarrez les conteneurs:

```bash
docker compose up -d --build
```

### Démarrage (local)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
