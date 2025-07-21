const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");

dotenv.config();
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const serviceAccount = require("./service-account-credentials.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("craftFlowDB");
    const usersCollection = database.collection("users");
    const tasksCollection = database.collection("work-sheet");
    const paymentsCollection = database.collection("payments");

    // Middleware to verify Firebase ID Token
    const verifyFBToken = async (req, res, next) => {
      const authHeaders = req.headers.authorization;
      if (!authHeaders || !authHeaders.startsWith("Bearer")) {
        return res
          .status(401)
          .send({ message: "Unauthorized access: Token missing or malformed" });
      }

      const token = authHeaders.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .send({ message: "Unauthorized access: Token missing" });
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.decodedToken = decodedToken;
        next();
      } catch (error) {
        return res
          .status(403)
          .send({ message: "Forbidden access: Invalid token" });
      }
    };

    // Middleware to verify Employee
    const verifyEmployee = async (req, res, next) => {
      const email = req.decodedToken.email;
      const query = { email };
      const user = await usersCollection.findOne(query);

      if (!user || user?.role !== "Employee") {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      next();
    };

    // Middleware to verify HR
    const verifyHR = async (req, res, next) => {
      const email = req.decodedToken.email;
      const query = { email };
      const user = await usersCollection.findOne(query);

      if (!user || user?.role !== "HR") {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      next();
    };

    // Middleware to verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decodedToken.email;
      const query = { email };
      const user = await usersCollection.findOne(query);

      if (!user || user.role !== "Admin") {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      next();
    };

    /** ----------------------check user status----------------------**/
    app.post("/login-check", async (req, res) => {
      try {
        const { email } = req.body;

        const user = await usersCollection.findOne({
          email: email.toLowerCase(),
        });
        if (user.status === "fired") {
          return res.status(403).send({
            message: "Your account has been disabled. Please contact admin.",
          });
        }

        res.send({ message: "User is active" });
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    /** ----------------------users api----------------------**/
    app.post("/users", async (req, res) => {
      try {
        const userInfo = req.body;
        const email = userInfo.email?.toLowerCase();

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res
            .status(409)
            .send({ message: "User with this email already exists" });
        }

        const userPayload = {
          ...userInfo,
          email,
          salary: parseInt(userInfo.salary),
        };

        if (email === "admin@gmail.com") {
          userPayload.role = "Admin";
          userPayload.designation = "Admin";
          userPayload.isVerified = true;
        }

        const result = await usersCollection.insertOne(userPayload);
        res.status(201).send(result);
      } catch (error) {
        console.error("Failed to insert user:", error.message);
        res.status(500).send({ error: "Failed to add user" });
      }
    });

    app.get("/users/me", verifyFBToken, async (req, res) => {
      try {
        const { email } = req.query;
        const user = await usersCollection.findOne({ email });
        res.send(user || {});
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/users/role", verifyFBToken, async (req, res) => {
      try {
        const email = req.decodedToken.email;
        const user = await usersCollection.findOne({ email });
        res.status(200).send({ role: user?.role || "Employee" });
      } catch (error) {
        res.status(500).send({ error: "Failed to get role" });
      }
    });

    app.get("/users/employees", verifyFBToken, verifyHR, async (req, res) => {
      try {
        const users = await usersCollection
          .find({
            role: { $in: ["HR", "Employee"] },
          })
          .toArray();

        users.sort((a, b) => {
          if (a.role === b.role) return 0;
          if (a.role === "HR") return -1;
          if (b.role === "HR") return 1;
          return 0;
        });

        res.status(200).send(users || []);
      } catch (error) {
        res.status(500).send({ error: "Failed to retrieve employee list" });
      }
    });

    app.patch(
      "/users/:id/update-verification",
      verifyFBToken,
      verifyHR,
      async (req, res) => {
        try {
          const id = req.params.id;
          const filter = { _id: new ObjectId(id) };
          const user = await usersCollection.findOne(filter);

          const updatedDoc = { $set: { isVerified: !user.isVerified } };
          const updated = await usersCollection.updateOne(filter, updatedDoc);

          res.send(updated);
        } catch (error) {
          res.status(500).send({ error: "Failed to update verified status" });
        }
      }
    );

    app.get("/users/:id/details", verifyFBToken, verifyHR, async (req, res) => {
      try {
        const { id } = req.params;

        const employee = await usersCollection.findOne({
          _id: new ObjectId(id),
        });

        const salaryHistory = await paymentsCollection
          .find({ email: employee.email })
          .sort({ year: 1, month: 1 })
          .toArray();

        res.send({
          name: employee.name,
          photo: employee.photo,
          designation: employee.designation,
          salaryHistory: salaryHistory.map(({ month, year, salary }) => ({
            month,
            year,
            salary,
          })),
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch employee details" });
      }
    });

    app.get("/users", verifyFBToken, verifyHR, async (req, res) => {
      try {
        const { role } = req.query;
        const filter = role ? { role } : {};
        const users = await usersCollection.find(filter).toArray();
        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

    app.get("/users/verified", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const users = await usersCollection
          .find({
            isVerified: true,
            role: { $in: ["HR", "Employee"] },
          })
          .toArray();

        users.sort((a, b) => {
          if (a.role === b.role) return 0;
          if (a.role === "HR") return -1;
          if (b.role === "HR") return 1;
          return 0;
        });

        res.status(200).send(users || []);
      } catch (error) {
        res.status(500).send({ error: "Failed to retrieve verified users" });
      }
    });

    app.patch(
      "/users/:id/make-hr",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const { id } = req.params;
          const filter = { _id: new ObjectId(id) };
          const updateRole = { $set: { role: "HR" } };

          const updated = await usersCollection.updateOne(filter, updateRole);
          res.send(updated);
        } catch (error) {
          res.status(500).send({ error: "Failed to update role" });
        }
      }
    );

    app.patch(
      "/users/:id/fire",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const { id } = req.params;
          const filter = { _id: new ObjectId(id) };
          const updateStatus = { $set: { status: "fired", role: "HR" } };

          const updated = await usersCollection.updateOne(filter, updateStatus);

          res.send(updated);
        } catch (error) {
          res.status(500).send({ error: "Failed to fire the user" });
        }
      }
    );

    /** ----------------------tasks api----------------------**/
    app.post("/work-sheet", verifyFBToken, verifyEmployee, async (req, res) => {
      try {
        const task = req.body;
        task.hours = parseInt(task.hours);
        const result = await tasksCollection.insertOne(task);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add task" });
      }
    });

    app.get(
      "/work-sheet/me",
      verifyFBToken,
      verifyEmployee,
      async (req, res) => {
        try {
          const { email } = req.query;

          const query = { created_by: email };
          const task = await tasksCollection
            .find(query)
            .sort({ date: -1 })
            .toArray();

          res.status(200).send(task || []);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch tasks" });
        }
      }
    );

    app.put(
      "/work-sheet/:id",
      verifyFBToken,
      verifyEmployee,
      async (req, res) => {
        try {
          const id = req.params.id;
          const updatedData = req.body;
          updatedData.hours = parseInt(updatedData.hours);

          const filter = { _id: new ObjectId(id) };
          const updateDoc = { $set: updatedData };

          const result = await tasksCollection.updateOne(filter, updateDoc);
          res.send(result);
        } catch (error) {
          res.status(500).send({ error: "Failed to update task" });
        }
      }
    );

    app.delete(
      "/work-sheet/:id",
      verifyFBToken,
      verifyEmployee,
      async (req, res) => {
        try {
          const id = req.params.id;
          const result = await tasksCollection.deleteOne({
            _id: new ObjectId(id),
          });
          res.send(result);
        } catch (error) {
          res.status(500).send({ error: "Failed to delete task" });
        }
      }
    );

    app.get("/work-sheet", verifyFBToken, verifyHR, async (req, res) => {
      try {
        const task = await tasksCollection.find().sort({ date: -1 }).toArray();
        res.status(200).send(task || []);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tasks" });
      }
    });

    /** ----------------------payment intent api----------------------**/
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    /** ----------------------payments api----------------------**/
    app.post("/payment", verifyFBToken, verifyHR, async (req, res) => {
      try {
        const paymentData = req.body;
        const { employeeId, month, year } = paymentData;

        // Validate year is a 4-digit number between 1900–2099
        if (!/^\d{4}$/.test(year) || year < 1900 || year > 2099) {
          return res.status(400).send({
            message:
              "Invalid year. Please enter a 4-digit year between 1900–2099.",
          });
        }

        // Convert month to number (if it’s a string like "July")
        const monthNumber = isNaN(month)
          ? new Date(`${month} 1, ${year}`).getMonth() + 1
          : parseInt(month);

        if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
          return res
            .status(400)
            .send({ message: "Invalid month. Please provide a valid month." });
        }

        paymentData.month = monthNumber;
        paymentData.year = parseInt(year);

        const isExists = await paymentsCollection.findOne({
          employeeId,
          month,
          year,
        });

        if (isExists) {
          return res.status(400).send({
            message: "Payment request for this month already exists.",
          });
        }

        const result = await paymentsCollection.insertOne(paymentData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create payment request." });
      }
    });

    app.get("/payments", verifyFBToken, verifyEmployee, async (req, res) => {
      try {
        const { email, page = 1, limit = 5 } = req.query;

        const query = { email };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const payments = await paymentsCollection
          .find(query)
          .sort({ year: -1, month: -1 })
          .skip(skip)
          .limit(limitNum)
          .toArray();

        const total = await paymentsCollection.countDocuments(query);
        res.send({ payments, total });
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch payments" });
      }
    });

    console.log("You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to CraftFlow API!");
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
