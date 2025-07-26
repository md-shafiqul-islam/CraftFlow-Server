# 🛠️ CraftFlow – Server Side

Backend for **CraftFlow**, a role-based employee management system designed for interior design and renovation companies. 
Manages authentication, user roles, task tracking, payroll processing, and secure API endpoints.

---

## 📌 About

Built with **Express.js** and **MongoDB**, this server handles secure user authentication with Firebase JWT, role-based access control, and data operations for tasks, users, payroll, and HR/admin functionality.

---

## ⚙️ Setup & Run Locally

1. Clone the repository

   ```bash
   git clone https://github.com/md-shafiqul-islam/craftflow-server.git
   cd craftflow-server

---

## 🛠 Tech Stack

- Node.js  
- Express.js  
- MongoDB
- Firebase Admin SDK
- JWT  
- Stripe API (salary payments)
- CORS & dotenv

---

## 🌐 Project Structure 

📦 server
 ┣ 📂 controllers
 ┣ 📂 middlewares
 ┣ 📂 models
 ┣ 📂 routes
 ┣ 📜 server.js
 ┣ 📜 .env.example
 ┗ 📜 package.json

---

## 📁 Repositories  
**Server:** [github.com/md-shafiqul-islam/craftflow-server](https://github.com/md-shafiqul-islam/craftflow-server)

---

## 🧪 Getting Started

To run this project locally:

# 1. Clone the repositories
git clone https://github.com/md-shafiqul-islam/craftflow-server.git

# 2. Install dependencies for both
cd ../craftflow-server
npm install

# 3. Set up environment variables
# For server: create `.env` inside `craftflow-server`
PORT=5000
DB_URL=MONGODB_URI
ACCESS_TOKEN_SECRET=FB_SERVICE_KEY
STRIPE_SECRET_KEY=PAYMENT_GATEWAY_KEY

# 4. Run server
# In terminal:
cd craftflow-server
nodemon index.js

---

## 🔧 Key Features

- Firebase JWT-based authentication & authorization
- Role-based middleware for Employee, HR, and Admin access
- CRUD APIs for managing tasks, users, and payroll
- Stripe API integration for secure salary payments
- Soft delete (fire) employees to restrict access

---

## 📄 License  
This project is open-source and available under the [MIT License](LICENSE).

---
