## AVENIR Bank
KECA Mathieu, 
GARCHI Adam, 
SAGUEZ Rémy, 5IW1
## Web Temps Réel (TP)

Cette section sert de **check‑list de validation** + **tutoriel de test** pour toutes les exigences du TP “Web en Temps Réel”.

### Rappel des exigences (mapping)

Client
- Authentification (inscription + email de vérification + compte auto‑créé)
- Discussion privée en temps réel (WebSocket)
- Activités / feed consultables en temps réel (SSE)

Conseiller
- Création d’actualités (visible côté clients)
- Notification temps réel à un client (SSE)
- Discussion privée temps réel (WebSocket)

Conseiller + Directeur
- Discussion de groupe temps réel (WebSocket)
- Le directeur se démarque visuellement dans la conversation

Contraintes techniques
- TypeScript (front + back)
- Chat via WebSocket (Socket.IO)
- Feed + notifications via SSE
- Fixtures / seed pour tester rapidement
- README: étapes d’installation + comptes de test + tuto de validation

### Où est implémenté le temps réel (preuves code)

- WebSocket (chat privé):
  - Backend: `backend/src/interface/messaging/messaging.gateway.ts`
  - Front: `lib/websocket-client.ts` + UI `components/organisms/UniversalMessagingPanel.tsx`
- WebSocket (chat de groupe):
  - Backend: `backend/src/interface/messaging/group-chat.gateway.ts`
  - Front: `lib/websocket-client.ts` + UI `components/organisms/UniversalMessagingPanel.tsx`
- SSE (feed activités):
  - Backend: `backend/src/interface/notifications/notifications.controller.ts` (`GET /sse/activities`)
  - Front: `components/organisms/ActivityFeed.tsx`
- SSE (notifications):
  - Backend: `backend/src/interface/notifications/notifications.controller.ts` (`GET /sse/notifications`)
  - Front: `contexts/ClientDataContext.tsx` (EventSource + ajout temps réel dans le state)

### Tutoriel complet (comment tester tout le TP)

#### 0) Démarrage + services

1) Lancer:

```bash
docker compose up -d --build
```

2) Ouvrir:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Mailpit (emails): http://localhost:8025

#### 1) Fixtures / comptes de test (seed)

Le backend exécute un seed **automatique** au démarrage (idempotent).

Comptes:
- Director: `director@avenir.test` / `Director123!`
- Advisor: `advisor@avenir.test` / `Advisor123!`
- Client 1: `client1@avenir.test` / `Client123!`
- Client 2: `client2@avenir.test` / `Client123!`

Relancer le seed si besoin:

```bash
docker exec avenirbank-backend npm run seed
```

#### 2) Auth: inscription + vérification email (preuve)

1) Aller sur http://localhost:3000/register
2) Créer un compte (prénom/nom/email/mot de passe)
3) Ouvrir Mailpit: http://localhost:8025
4) Ouvrir l’email reçu et cliquer sur le lien de vérification (route `/verify-email/...`)
5) Aller sur http://localhost:3000/login et se connecter

#### 3) Discussion privée (WebSocket) — Client ↔ Conseiller

Objectif: prouver que les messages arrivent **sans refresh**.

1) Ouvrir 2 sessions navigateur:
	- Session A: client (`client1@avenir.test`)
	- Session B: conseiller (`advisor@avenir.test`)
2) Côté client: http://localhost:3000/client/messages
	- Démarrer une discussion avec un conseiller
	- Envoyer un message
3) Côté conseiller: http://localhost:3000/advisor/messages
	- La conversation / le message apparaît en temps réel
	- Répondre: le client reçoit en temps réel

Bonus: indicateur “en train d’écrire”
- Dans la page Messages, taper dans l’input: l’autre participant voit “est en train d’écrire…”

#### 4) Feed / activités (SSE) — temps réel côté client

Objectif: prouver que les actualités arrivent via SSE.

1) Session client: ouvrir http://localhost:3000/client/activity et laisser ouvert
2) Session conseiller: ouvrir http://localhost:3000/advisor/activities/create
3) Créer une actualité (titre + description)
4) Revenir côté client: l’actualité apparaît **sans refresh**

#### 5) Notifications (SSE) — temps réel côté client

Objectif: prouver que les notifications arrivent via SSE.

1) Session client: laisser ouvert le dashboard http://localhost:3000/client
2) Session conseiller: ouvrir http://localhost:3000/advisor/notifications
3) Sélectionner le client + écrire un message personnalisé + “Envoyer la notification”
4) Côté client: constater **sans refresh**:
	- le compteur “Notifications” se met à jour,
	- et la notification est ajoutée au state.

#### 6) Discussion de groupe (WebSocket) — Conseiller ↔ Directeur

Objectif: prouver un chat de groupe + le directeur se démarque visuellement.

1) Ouvrir 2 sessions navigateur:
	- Session A: conseiller (`advisor@avenir.test`)
	- Session B: directeur (`director@avenir.test`)
2) Les deux: aller sur la page Messages:
	- Conseiller: http://localhost:3000/advisor/messages
	- Directeur: http://localhost:3000/director/messages
3) Créer un groupe (bouton “Créer un groupe” dans la page Messages) en ajoutant conseiller + directeur
4) Envoyer un message dans le groupe
5) Vérifier que les messages du directeur sont **mis en avant** visuellement (badge/teinte “Directeur”)

#### 7) Bonus: Web Push (notifications navigateur)

Pré‑requis: configurer les variables VAPID (voir section “Bonus Web Push” plus bas).

1) Sur le navigateur du client: accepter les notifications (permission)
2) Envoyer une notification depuis le conseiller/directeur
3) Le navigateur reçoit une notification “push” (même si l’onglet n’est pas au premier plan)

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

### Preuve SSE (notifications en temps réel côté client)

Le **feed** et les **notifications** sont en temps réel via **Server‑Sent Events (SSE)**.

- Backend (SSE) : [backend/src/interface/notifications/notifications.controller.ts](backend/src/interface/notifications/notifications.controller.ts)
	- `GET /sse/activities` (feed)
	- `GET /sse/notifications` (notifications)
- Frontend (abonnement SSE notifications) : [contexts/ClientDataContext.tsx](contexts/ClientDataContext.tsx)
	- `EventSource(${BACKEND_URL}/sse/notifications?token=...)`
	- à chaque événement `type: "notification"`, la notif est ajoutée au state (`PREPEND_NOTIFICATION`) sans rechargement.

Recette de test rapide :

1) Lancer le projet : `docker compose up -d --build`
2) Ouvrir deux sessions navigateur :
	 - Conseiller : `advisor@avenir.test` / `Advisor123!`
	 - Client : `client1@avenir.test` / `Client123!`
3) Depuis l’espace conseiller, envoyer une notification personnalisée à ce client.
4) Côté client, constater **sans refresh** :
	 - le compteur “Notifications” du dashboard se met à jour (state notifications),
	 - et/ou la section épargne affiche la nouvelle notification si elle est liée au “taux d’épargne”.

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
