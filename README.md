# İmtahanVer.net

**İmtahanVer.net** is an online examination and practice platform where users can take online exams, test their knowledge, track their results, and access educational content.

The platform supports **Azerbaijani, English, and Russian** languages and is built as a full-stack web application with a separate frontend and backend.

> 🌐 **Live Website:** https://imtahanver.net

> 📌 **This repository is public.**

---

## 🌐 Live Project

- **Website:** https://imtahanver.net
- **API:** https://api.imtahanver.net

---

## 📖 About

İmtahanVer.net is an online exam platform focused on providing users with a simple way to prepare for and take practice examinations.

The frontend is built with **Next.js, React, and TypeScript**, while the backend is developed separately using **NestJS, Prisma, and PostgreSQL**.

The platform includes authentication, online exams, exam tokens, results, payments, news, multilingual support, AI-assisted writing evaluation, and an administrative panel.

---

## ✨ Features

### 👤 Authentication

- User registration
- User login
- Logout
- Account verification
- Password reset
- Authentication cookies
- Protected routes
- User profile

### 📝 Online Exams

- Online practice exams
- Multiple-choice questions
- Five answer options
- Randomized questions
- Timed exams
- Exam token system
- Automatic exam completion
- Exam submission
- Result calculation
- Exam history

### 🎫 Exam Tokens

The platform uses an exam token system to control access to examinations.

Features include:

- Token creation
- Token validation
- Token expiration
- Exam duration
- Expired token handling
- Automatic exam completion

### 📊 Results

Users can view their completed exam results and examination history.

### ✍️ Writing Exams

The platform also supports writing-based examinations.

Writing submissions can be processed asynchronously and evaluated through an AI-assisted workflow.

Example processing state:

```text
WAITING_AI
```

### 🤖 AI Evaluation

Writing exams can be processed by an AI worker.

The asynchronous workflow allows AI evaluation to run separately from the main exam submission process.

### 📰 News

The platform includes a multilingual news section.

Supported languages:

- Azerbaijani
- English
- Russian

Example URLs:

```text
/az/news
/en/news
/ru/news
```

Individual news articles use dynamic routes:

```text
/az/news/[id]
/en/news/[id]
/ru/news/[id]
```

### 💳 Payments

The platform includes payment and balance functionality.

Payment-related features include:

- User balance
- Payment status
- Payment history
- Successful payments
- Failed payments
- Exam token purchases
- Epoint payment widget integration

### 👨‍💼 Admin Panel

The application includes an administrative panel for managing platform data.

Administrative functionality includes management of:

- Users
- Exams
- Questions
- News
- Platform settings
- Other application data

### 🌍 Multilingual Support

The application supports:

- 🇦🇿 Azerbaijani
- 🇬🇧 English
- 🇷🇺 Russian

Localized URLs use the following structure:

```text
/az
/en
/ru
```

Examples:

```text
/az/about
/en/about
/ru/about

/az/contact
/en/contact
/ru/contact

/az/faq
/en/faq
/ru/faq

/az/news
/en/news
/ru/news
```

### 🌙 Dark Mode

The frontend supports dark mode and theme switching.

### 📱 Responsive Design

The application is designed for:

- Desktop
- Laptop
- Tablet
- Mobile devices

### 📱 Android

The web application can also be packaged as an Android application using **Capacitor**.

---

# 🛠️ Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Next Themes
- React Hook Form
- Zod
- Lucide React
- React Share

## Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- REST API

## Infrastructure

- Linux
- Docker
- Docker Compose
- Nginx
- Cloudflare
- Tailscale

## Mobile

- Capacitor
- Android

---

# 🏗️ Architecture

The project uses a separated frontend and backend architecture.

```text
                    ┌─────────────────────┐
                    │       User          │
                    │ Browser / Mobile    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Cloudflare      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        Nginx        │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
          ┌──────────────────┐   ┌──────────────────┐
          │ Next.js Frontend │   │   NestJS API     │
          │      React       │   │                  │
          │    TypeScript    │   │     Prisma       │
          └──────────────────┘   └────────┬─────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │   PostgreSQL     │
                                └──────────────────┘
```

---

# 📁 Project Structure

```text
Exam_Website_Frontend/
│
├── app/
│   ├── about/
│   ├── actions/
│   ├── admin/
│   ├── api/
│   ├── balance/
│   ├── contact/
│   ├── dashboard/
│   ├── exam-continue/
│   ├── exam-token/
│   ├── exams/
│   ├── faq/
│   ├── forgot-password/
│   ├── login/
│   ├── maintenance/
│   ├── news/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── news-detail-client.tsx
│   ├── payments/
│   ├── privacy/
│   ├── profile/
│   ├── register/
│   ├── reset-password/
│   ├── results/
│   ├── terms/
│   ├── universities/
│   ├── verify/
│   ├── error.tsx
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
│
├── assets/
├── components/
├── contexts/
├── helper/
├── hooks/
├── lib/
├── public/
├── types/
│
├── .env
├── next.config.mjs
├── package.json
└── README.md
```

---

# 🔀 Routing

The application uses localized public URLs.

The default locale is:

```text
az
```

The root URL:

```text
/
```

redirects to:

```text
/az
```

Localized routes are handled through the application's routing/proxy layer.

For example:

```text
/en/news
```

is internally mapped to the corresponding news page while preserving the English locale.

The same approach is used for Azerbaijani and Russian routes.

---

# 🌍 Localization

The supported locales are:

```text
az
en
ru
```

The locale is determined from the URL.

Examples:

```text
/az
/en
/ru
```

The frontend also provides a language switcher that allows users to change the current locale.

---

# 📰 News Architecture

News pages are separated into a list page and dynamic detail pages.

```text
app/
└── news/
    ├── page.tsx
    └── [id]/
        ├── page.tsx
        └── news-detail-client.tsx
```

The news detail page uses server-side metadata generation and client-side UI rendering.

News detail pages support:

- Dynamic page titles
- Meta descriptions
- Canonical URLs
- `hreflang`
- Open Graph
- Twitter Cards
- NewsArticle JSON-LD
- Social sharing
- Localized content
- Dynamic images

---

# 🔍 SEO

SEO is implemented throughout the public part of the application.

The project includes:

- Dynamic metadata
- Canonical URLs
- `hreflang`
- Open Graph metadata
- Twitter Card metadata
- XML sitemap
- Robots configuration
- JSON-LD structured data
- NewsArticle structured data
- Localized URLs
- Search-engine-friendly public pages

---

## 🗺️ Sitemap

The application provides:

```text
/sitemap.xml
```

The sitemap contains localized public pages and published news pages.

Examples:

```text
/az
/en
/ru

/az/about
/en/about
/ru/about

/az/news
/en/news
/ru/news
```

News detail pages can also be included dynamically.

---

## 🤖 Robots

The application provides:

```text
/robots.txt
```

Private and administrative routes are excluded from search engine crawling.

Examples:

```text
/admin/
/login/
/register/
/dashboard/
/profile/
/balance/
/payments/
/exam-token/
/exam-continue/
/results/
```

Localized versions of these routes are also excluded where applicable.

> `robots.txt` is not a security mechanism. Private resources must always be protected by authentication and authorization on the server.

---

# 🔐 Security

The application uses multiple layers of security and access control.

These include:

- HTTPS
- Authentication cookies
- Protected API endpoints
- Admin authorization
- Cloudflare
- Nginx
- Server-side environment variables
- Token expiration
- Server-side validation
- Search engine restrictions for private routes

### Important

Never expose sensitive credentials in the frontend.

Do not put the following into public client-side environment variables:

- Database passwords
- JWT secrets
- Private API keys
- Server credentials
- Other sensitive secrets

---

# ⚙️ Requirements

To run the frontend locally, you need:

- Node.js
- npm
- Git
- Access to the backend API

For full-stack development, you may also need:

- PostgreSQL
- Prisma
- NestJS
- Docker

---

# 📦 Installation

Clone the repository:

```bash
git clone git@github.com:Rahil-Huseynov/Exam_Website_Frontend.git
```

Or using HTTPS:

```bash
git clone https://github.com/Rahil-Huseynov/Exam_Website_Frontend.git
```

Enter the project directory:

```bash
cd Exam_Website_Frontend
```

Install dependencies:

```bash
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file in the root directory.

Example:

```env
NEXT_PUBLIC_API_URL=https://api.imtahanver.net/api
NEXT_PUBLIC_API_URL_FOR_IMAGE=https://api.imtahanver.net
```

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
NEXT_PUBLIC_API_URL_FOR_IMAGE=http://localhost:3002
```

The exact environment variables may depend on the local or production configuration.

> Do not commit `.env` files containing secrets to the public repository.

---

# 💻 Development

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

---

# 🏭 Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# 🧹 Linting

If the project contains a lint script in `package.json`, run:

```bash
npm run lint
```

---

# 📱 Android Application

The project can be packaged as an Android application using Capacitor.

Application ID:

```text
com.imtahanver.app
```

Application name:

```text
ImtahanVer
```

---

## Android Development

Build the web application:

```bash
npm run build
```

Synchronize Capacitor:

```bash
npx cap sync android
```

Open the Android project:

```bash
npx cap open android
```

Run on a connected Android device:

```bash
npx cap run android
```

---

## Android Release

A release Android App Bundle can be generated with Android Studio or Gradle.

Example:

```bash
cd android
./gradlew bundleRelease
```

---

# 🐳 Docker

Docker can be used as part of the production deployment.

The application can be deployed alongside the backend API and database.

Example:

```text
┌────────────────────┐
│      Next.js       │
│     Frontend       │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│      NestJS        │
│        API         │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    PostgreSQL      │
└────────────────────┘
```

---

# 🌐 Deployment

The production infrastructure can use:

- Cloudflare
- Nginx
- Docker
- Linux
- Next.js
- NestJS
- PostgreSQL

Production domains:

```text
Frontend:
https://imtahanver.net

API:
https://api.imtahanver.net
```

---

# 💳 Payment Integration

The platform integrates payment functionality through Epoint.

The frontend contains the payment widget integration and communicates with the backend for payment-related operations.

Payment operations should always be validated by the backend.

---

# 📈 Performance

The project has been optimized for modern web performance.

Optimization areas include:

- Next.js production builds
- Responsive UI
- Asset optimization
- Server/client rendering
- SEO metadata
- Cloudflare
- Nginx
- Mobile optimization

The website has been tested using Google PageSpeed Insights.

---

# 🧪 Testing Checklist

Before deploying a new version, the following flows should be tested.

## Authentication

```text
[ ] Registration
[ ] Login
[ ] Logout
[ ] Account verification
[ ] Password reset
```

## Exams

```text
[ ] Exam listing
[ ] Exam token
[ ] Exam start
[ ] Question navigation
[ ] Timer
[ ] Exam submission
[ ] Automatic completion
[ ] Result page
```

## Payments

```text
[ ] Balance
[ ] Payment creation
[ ] Successful payment
[ ] Failed payment
[ ] Token purchase
```

## Localization

```text
[ ] Azerbaijani
[ ] English
[ ] Russian
[ ] Language switching
[ ] Localized URLs
```

## News

```text
[ ] News listing
[ ] Pagination
[ ] News detail
[ ] Localized news
[ ] Social sharing
[ ] SEO metadata
```

## Mobile

```text
[ ] Responsive layout
[ ] Android application
[ ] Navigation
[ ] Authentication
[ ] Exam interface
```

---

# 🚀 Deployment Checklist

Before deploying to production:

```text
[ ] Environment variables configured
[ ] Production API available
[ ] Dependencies installed
[ ] Production build successful
[ ] Authentication tested
[ ] Exam flow tested
[ ] Payment flow tested
[ ] News pages tested
[ ] Localization tested
[ ] Mobile layout tested
[ ] robots.txt checked
[ ] sitemap.xml checked
[ ] HTTPS working
[ ] Cloudflare configuration checked
[ ] Nginx configuration checked
```

---

# 📌 Public Repository

This repository is publicly available on GitHub.

Repository:

https://github.com/Rahil-Huseynov/Exam_Website_Frontend

Although the repository is public, sensitive configuration and credentials must never be committed.

The following files and values should remain private:

```text
.env
Database credentials
JWT secrets
Private API keys
Server credentials
Authentication secrets
```

Public source code does not mean private credentials should be included in the repository.

---

# 🔗 Links

### 🌐 Website

https://imtahanver.net

### 🔌 API

https://api.imtahanver.net

### 💻 GitHub Repository

https://github.com/Rahil-Huseynov/Exam_Website_Frontend

### 👨‍💻 Portfolio

https://rahil-huseynov.netlify.app/

### 💼 LinkedIn

https://www.linkedin.com/in/rahil-huseynov/

---

# 👨‍💻 Author

## Rahil Huseynov

Frontend / Full-Stack Developer

- GitHub: https://github.com/Rahil-Huseynov
- LinkedIn: https://www.linkedin.com/in/Rahil-Huseynov/
- Portfolio: https://rahil-huseynov.netlify.app/

---

# 📄 License

This project is currently provided as a public repository for demonstration and development purposes.

The source code is publicly accessible, but this does not automatically grant permission to use the project commercially or redistribute it as your own work.

Please contact the author before using the project or its assets for commercial purposes.

---

# ⭐ İmtahanVer.net

**Online sınaq imtahanı platforması**

🌐 https://imtahanver.net
