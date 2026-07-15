<div align="center">
  <img src="public/logo.png" width="100" height="100" alt="NOTOO Logo" />
  <h1>NOTOO Educational Platform</h1>
  <p>Notes Organized Through Open Opportunities</p>
</div>

## Overview

The NOTOO Platform is a modern full stack web application designed to facilitate seamless learning, tutoring, and educational resource management. The platform features distinct dashboards tailored for different user roles, providing interactive study tools, secure payments, and performance tracking. The primary goal of NOTOO is to empower students and educators by organizing educational content and providing open opportunities for growth.

## Key Features

### Role Based Portals
* Student Dashboard: Access to purchased courses, interactive flashcards, spaced repetition tracking, study chat, and performance readiness analytics.
* Tutor Dashboard: Create and manage courses, upload video content, track student enrollment, handle class schedules, and review earnings.
* Intern Dashboard: Review and manage educational materials, moderate content, and assist with platform administration.
* Admin Dashboard: Full oversight of platform activity, user management, global announcements, and system configurations.

### Advanced Learning Tools
* Flashcards and Spaced Repetition: Dynamic algorithms to optimize study schedules and retention.
* Resource Manager: Secure upload and organization of PDFs, Past Papers, Mark Schemes, and videos.
* Study Chat and Groups: Real time collaborative environments for peer to peer learning and RAG based AI chat functionality.

## Tech Stack

### Frontend
* React 19 and Vite: Ultra fast hot reloading and modern React features.
* Tailwind CSS v4: Utility first styling for a completely custom and beautiful UI using standardized design tokens.
* Framer Motion: Smooth and dynamic layout transitions and micro interactions.
* Lucide React: Clean and consistent iconography.

### Backend
* PHP 8.2: A lightweight and robust REST API powered by vanilla PHP with PDO.
* PostgreSQL: Relational database schema with robust foreign key constraints and pgvector support for advanced AI integrations.
* JWT Authentication: Secure and stateless user sessions and role validation.

### Deployment and DevOps
* Docker and Docker Compose: Unified local development environments and streamlined monolithic production builds.

## Local Development Setup

To run this project locally, ensure you have Node.js, Docker, and Docker Compose installed.

1. Clone the Repository
```bash
git clone https://github.com/abdulwasay4585/noto.git
cd noto
```

2. Set Up the Database
Start the PostgreSQL container in the background:
```bash
docker compose up db -d
```
(Note: The database will automatically be seeded with schema.sql upon the first launch.)

3. Install Dependencies and Start the Dev Server
```bash
npm install
npm run dev
```

4. Access the Application
* Frontend: `http://localhost:5173`
* API Backend: `http://localhost:8000/api`

## Production Deployment

The project includes a Dockerfile.prod configured to bundle both the React frontend and the PHP backend into a single highly efficient Apache container. 

For a step by step guide on how to deploy this entire platform for free, please read the deployment.md file.

## Default Credentials

If you just seeded a fresh database, you can log in to the admin panel using the default credentials:

* Email: admin@noto.com
* Password: noto-admin

(Please make sure to change this in production!)
