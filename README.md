# XSchool - Système de Gestion Scolaire Moderne

XSchool est une plateforme complète et moderne de gestion pour les établissements scolaires, conçue pour simplifier le suivi administratif et financier.

## 🚀 Fonctionnalités Clés

- **Tableau de Bord Dynamique** : Visualisation en temps réel des statistiques (taux de recouvrement, effectifs, opérations récentes).
- **Gestion des Élèves** : Inscription, suivi des dossiers et affichage standardisé (**NOM Prénom**).
- **Gestion Financière** : Suivi des paiements par tranches, calcul du solde progressif et gestion des dépenses.
- **Expérience Utilisateur Premium** : Interface responsive (Tablettes & Téléphones), dialogues de confirmation intuitifs et design moderne sous MUI v7.
- **Sécurité** : Authentification JWT, rôles (Admin, Comptable, Professeur) et sécurité renforcée.

## 🛠️ Stack Technique

- **Frontend** : [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Material UI v7](https://mui.com/), [TypeScript](https://www.typescriptlang.org/).
- **Backend** : [Django 4.2](https://www.djangoproject.com/), [Django REST Framework](https://www.django-rest-framework.org/).
- **Déploiement** : Prêt pour [Vercel](https://vercel.com/) (Configurations incluses).

## 💻 Installation en Local

### Backend (Django)
1. Allez dans le dossier backend : `cd backend`
2. Installez les dépendances : `pip install -r requirements.txt`
3. Configurez la base de données : `python manage.py migrate`
4. Lancez le serveur : `python manage.py runserver`

### Frontend (React)
1. Allez dans le dossier frontend : `cd frontend`
2. Installez les dépendances : `npm install`
3. Lancez le serveur de développement : `npm run dev`

## 🌍 Déploiement sur Vercel

Le projet est pré-configuré pour un déploiement rapide sur Vercel.

### Variables d'environnement nécessaires :

#### Sur le projet Backend :
- `DATABASE_URL` : Lien vers votre base de données PostgreSQL (ex: Supabase).
- `SECRET_KEY` : Clé secrète Django.
- `DEBUG` : Mettre à `False` en production.

#### Sur le projet Frontend :
- `VITE_API_BASE_URL` : L'URL de votre API déployée (ex: `https://votre-backend.vercel.app/api/`).

---
Développé avec ❤️ pour l'excellence académique.
