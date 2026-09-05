# CraftFlow — Server

Backend API for **CraftFlow**, a role-based employee management system designed to manage employees, tasks, payroll workflows, and role-based operations.

The server provides secure API endpoints for authentication, authorization, employee management, task tracking, payroll processing, and administrative operations.

---

## 🚀 Project Overview

CraftFlow is a full-stack employee management platform with three primary roles:

- 👨‍💻 **Employee** — Manage daily tasks and track work activity
- 🧑‍💼 **HR** — Verify employees, manage records, and process payroll requests
- 👨‍💻 **Admin** — Manage users, roles, payroll approvals, and system operations

This repository contains the backend API that powers the CraftFlow application.

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- Firebase token verification
- JWT-based authentication
- Protected API endpoints
- Secure authorization middleware

### 🛡️ Role-Based Access Control

Role-based permissions for:

- Employee
- HR
- Admin

Middleware ensures users can only access resources and operations permitted for their role.

### 👥 User Management

- Manage employee accounts
- Verify employee profiles
- Promote employees to HR roles
- Restrict employee access through soft deletion

### 📝 Task Management

- Create employee work records
- Update task information
- Delete tasks
- Retrieve employee work history
- Support task filtering and management workflows

### 💰 Payroll Management

- Create salary and payment requests
- Process payroll workflows
- Prevent duplicate payment operations
- Manage salary-related records

### 💳 Stripe Payment Integration

- Secure payment processing
- Stripe payment workflow integration
- Payment status management

### 🌐 RESTful API

- Structured API routes
- CRUD operations
- Protected endpoints
- Middleware-based authorization

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Firebase Admin SDK**
- **JWT**
- **Stripe**
- **CORS**
- **dotenv**

---

## 🌐 Live Project

👉 [Live](https://craft-flow.netlify.app/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/md-shafiqul-islam/CraftFlow-Server
```

### 2. Navigate to the Project
```bash
cd CraftFlow-Server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

```env
PORT=5000
DB_URL=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
FB_SERVICE_KEY=your_firebase_service_account_credentials
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 5. Run the Server

```bash
nodemon index.js
```

---

## 🔗 Related Repository

- Frontend: [CraftFlow Client](https://github.com/md-shafiqul-islam/CraftFlow-Client)

---

## 🧩 API Capabilities

The backend supports APIs for:

- Authentication and authorization
- User management
- Employee verification
- Role management
- Task management
- Work records
- Payroll requests
- Salary processing
- Payment workflows
- Administrative operations

---

## 🔒 Security

The application implements several security-focused practices:

- Firebase token verification
- JWT authentication
- Protected API routes
- Role-based authorization
- Server-side access validation
- Environment variable protection
- CORS configuration

---

## 📌 Related Project

CraftFlow is a full-stack employee management system designed to streamline workplace operations
through dedicated dashboards and role-based workflows.

Main Features:

- Role-Based Access Control (Employee, HR, Admin)
- Employee management
- Task tracking
- Employee verification
- Payroll workflows
- Secure authentication
- Stripe payment integration
- Dashboard analytics

---

### 👨‍💻 Author

Md. Shafiqul Islam

Software Engineer | Full-Stack Developer

- [Porfolio](https://shafiqul-islam.netlify.app/)
- [LinkedIn](https://www.linkedin.com/in/mdshafiqulislam1/)
- [GitHub](https://github.com/md-shafiqul-islam)

---
