# 🍔 FoodExpress

**FoodExpress** is a web-based food ordering and delivery platform developed using the MEAN Stack (MongoDB, Express.js, Angular, and Node.js).

The platform connects customers with restaurants, allowing customers to discover restaurants, explore menus, place orders, and follow their orders. Restaurateurs can manage their restaurants and orders, while administrators manage users and supervise the platform.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Technologies](#-technologies)
- [User Roles](#-user-roles)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Default Accounts](#-default-accounts-development)
- [Authentication and Security](#-authentication-and-security)
- [Implemented Features](#-implemented-features)
- [API Endpoints](#-api-endpoints)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [Design](#-design)
- [Future Improvements](#-future-improvements)

---

## 🎯 Project Overview

FoodExpress aims to simplify food ordering by providing a centralized platform where customers can discover restaurants and order their favorite meals.

### Main Objectives

- Provide an easy-to-use food ordering platform.
- Allow customers to browse restaurants and menus.
- Facilitate online food ordering.
- Help restaurateurs manage their restaurants and incoming orders.
- Provide administrators with tools to manage platform users.
- Ensure secure authentication and role-based access control.

---

## 🛠 Technologies

The project uses the MEAN Stack.

| Technology | Purpose |
|---|---|
| MongoDB | NoSQL database |
| Express.js | Backend web framework |
| Angular | Frontend framework |
| Node.js | Backend JavaScript runtime |
| Mongoose | MongoDB object modeling |
| JSON Web Token (JWT) | Authentication |
| bcryptjs | Password hashing |
| HTML5 | Page structure |
| CSS3 | Styling |
| TypeScript | Frontend development |
| npm | Package management |
| Git & GitHub | Version control |

---

## 👥 User Roles

FoodExpress supports three main user roles.

### 1. Client

Customers can:
- Create an account and log in.
- Browse available restaurants.
- Explore restaurant menus.
- Add meals to their cart.
- Place orders.
- Follow their orders.
- Manage their personal profile.

### 2. Restaurateur

Restaurant owners can:
- Access their restaurateur dashboard.
- Manage restaurant information.
- Manage menus and meals.
- View incoming orders.
- Update order statuses.
- Manage restaurant-related information.

### 3. Administrator

Administrators can:
- Access the administration dashboard.
- View registered users.
- Search and filter users.
- View user details.
- Edit user information.
- Change user roles.
- Activate or deactivate accounts.
- Delete user accounts.
- Manage platform users securely.

---

## 📁 Project Structure

The project is organized into two main folders:

```text
FoodExpress/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.js
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── environments/
│   │   └── styles.css
│   │
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

*Note: This is the main project structure. Additional files and feature folders may exist as development progresses.*

---

## ⚙️ Installation and Setup

### Prerequisites

Before running the project, make sure you have installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [Angular CLI](https://angular.dev/tools/cli)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended)

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd FoodExpress
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure the Backend Environment

Create a `.env` file inside the `backend/` folder.

Configure the required environment variables as described below.

### 4. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

---

## 🔐 Environment Configuration

The backend requires environment variables to connect to MongoDB and configure authentication.

Example `backend/.env`:

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/foodexpress

JWT_SECRET=your_secret_key
```

### Default Account Configuration

Add the following variables if the automatic account seeders are implemented:

```env
ADMIN_NAME=Admin
ADMIN_LASTNAME=FoodExpress
ADMIN_EMAIL=admin@foodexpress.com
ADMIN_PASSWORD=Admin@123456

RESTAURATEUR_NAME=FoodExpress
RESTAURATEUR_LASTNAME=Restaurant
RESTAURATEUR_EMAIL=restaurateur@foodexpress.com
RESTAURATEUR_PASSWORD=Restaurant@123
```

**Important:**
- Make sure MongoDB is running before starting the backend.
- Never upload your `.env` file to GitHub.
- Use strong secrets and passwords.
- Keep `.env.example` updated without including real secrets.

---

## 🔑 Default Accounts (Development)

FoodExpress is designed to provide predefined accounts for testing the different user roles.

### Administrator Account

| Field | Value |
|---|---|
| Role | `admin` |
| Email | `admin@foodexpress.com` |
| Password | `Admin@123456` |

### Restaurateur Account

| Field | Value |
|---|---|
| Role | `restaurateur` |
| Email | `restaurateur@foodexpress.com` |
| Password | `Restaurant@123` |

### Client Account

Clients can create their own accounts using the registration page.

**Note:** The administrator and restaurateur accounts must be created by the corresponding backend seeders. The credentials above will work only if those seeders are implemented and the environment variables are configured correctly.

These credentials are intended for local development and testing only. Change them before any production deployment.

---

## 🔒 Authentication and Security

FoodExpress implements authentication and authorization mechanisms to protect user accounts and application resources.

### Authentication

- User registration.
- User login.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Authenticated user information retrieval.
- Session management.
- Logout functionality.

### Authorization

- Role-based access control.
- Protected backend routes.
- Angular authentication guards.
- Angular role guards.
- Separate access for clients, restaurateurs, and administrators.

### Account Management

- View personal profile.
- Edit personal information.
- Change account password.
- Activate and deactivate accounts.
- Secure administrator user management.

### Password Recovery

Users who forget their passwords should contact the administrator to request a password reset.

---

## ✅ Implemented Features

### Authentication and User Management

- [x] User registration.
- [x] User login.
- [x] Password hashing.
- [x] JWT authentication.
- [x] Authentication middleware.
- [x] Role-based authorization.
- [x] Protected frontend routes.
- [x] Protected backend routes.
- [x] Profile viewing.
- [x] Profile editing.
- [x] Password changing.
- [x] Administrator account management.
- [x] User search and filtering.
- [x] User activation and deactivation.
- [x] User role management.
- [x] User deletion.
- [x] Default administrator account seeder.
- [x] Default restaurateur account seeder.

### Other Platform Modules

The following modules are part of the overall project scope. Their implementation status should be updated as development progresses.

- [ ] Restaurant management.
- [ ] Restaurant categories.
- [x] Meal and menu management.
- [ ] Shopping cart.
- [ ] Order placement.
- [ ] Order management.
- [ ] Order status tracking.
- [ ] Platform statistics and reports.

---

## 🌐 API Endpoints

The backend exposes REST API endpoints.

### Authentication Routes

Base URL:

```text
http://localhost:5000/api/auth
```

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/register` | Register a new client | Public |
| POST | `/login` | Authenticate a user | Public |
| GET | `/me` | Get authenticated user information | Authenticated |
| PUT | `/profile` | Update personal profile | Authenticated |
| PUT | `/change-password` | Change account password | Authenticated |

### User Management Routes

Base URL:

```text
http://localhost:5000/api/users
```

All these endpoints require authentication and administrator authorization.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Retrieve users with pagination and filters |
| GET | `/:id` | Retrieve user details |
| PUT | `/:id` | Update user information |
| PATCH | `/:id/status` | Activate or deactivate a user |
| DELETE | `/:id` | Delete a user |

### Restaurant Menu Routes

Base URL: `http://localhost:5000/api/restaurants/:restaurantId/dishes`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/` | List dishes for an approved restaurant, including availability | Public |
| GET | `/manage` | List dishes for a restaurant owned by the connected restaurateur | Restaurateur (owner) |
| POST | `/` | Add a dish to an owned restaurant | Restaurateur (owner) |
| PUT | `/:dishId` | Update a dish belonging to an owned restaurant | Restaurateur (owner) |
| DELETE | `/:dishId` | Delete a dish belonging to an owned restaurant | Restaurateur (owner) |

Each dish stores its name, image URL, description, price in DT, category, availability, and restaurant. Categories are Entrées, Plats principaux, Pizzas, Sandwichs, Desserts, and Boissons.

### Authentication Header

Protected endpoints require a JWT token:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## ▶️ Running the Application

FoodExpress requires the backend, MongoDB, and frontend to be running.

### 1. Start MongoDB

Make sure your local MongoDB service is running.

### 2. Start the Backend

Open a terminal:

```bash
cd backend
npm run dev
```

The backend will be available at:

```text
http://localhost:5000
```

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
ng serve
```

The Angular application will be available at:

```text
http://localhost:4200
```

### 4. Access FoodExpress

Open your browser and visit:

```text
http://localhost:4200
```

You can now register as a client or log in using a configured development account.

---

## 🧪 Testing

The project includes checks for backend and frontend functionality.

### Authentication Testing

- Register a new client.
- Log in with valid credentials.
- Verify invalid login attempts.
- Verify duplicate email handling.
- Verify JWT-protected routes.
- Verify disabled account access restrictions.
- Verify profile updates.
- Verify password changes.

### Administrator Testing

- Log in as administrator.
- Access the administration dashboard.
- Search and filter users.
- View user details.
- Edit user information.
- Change user roles.
- Activate and deactivate accounts.
- Delete a test user.
- Verify that non-administrators cannot access administration features.

### Frontend Testing

- Verify login and registration forms.
- Verify role-based redirects.
- Verify protected routes.
- Verify profile management.
- Verify administrator navigation.

---

## 🎨 Design

FoodExpress follows a modern, warm, and user-friendly visual identity.

### Color Palette

| Color | Hex Code | Usage |
|---|---|---|
| Terracotta | `#D6834F` | Primary color |
| Ocre | `#E6AE74` | Secondary color |
| Cinnamon | `#A35233` | Accent color |
| Warm Cream | `#FFF8F6` | Background |
| Espresso | `#42281C` | Text |

### Design Principles

- Clean and modern interface.
- Responsive layouts.
- Rounded cards and buttons.
- Soft shadows and subtle borders.
- Clear navigation.
- Consistent typography.
- User-friendly forms and dashboards.

---

## 🚀 Future Improvements

Possible improvements include:

- Online payment integration.
- Real-time order tracking.
- Restaurant ratings and reviews.
- Notifications for order updates.
- Advanced search and filtering.
- Delivery management.
- Improved analytics dashboards.
- Deployment to a production environment.

---

## 🔒 Security Notes

For production deployment:

- Replace development passwords.
- Use a strong and private JWT secret.
- Configure secure environment variables.
- Enable HTTPS.
- Configure production CORS rules.
- Never expose sensitive user information.
- Validate all incoming data.
- Use secure database credentials.

---

## 👨‍💻 Development Team

**Project:** FoodExpress  
**Academic Year:** 2026–2027  
**Technology:** MEAN Stack  
**Project Type:** Web Application

---

## 📄 License

This project was developed for academic and educational purposes.

All rights reserved to the project development team.
