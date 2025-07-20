const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

    app.get("/users", async (req, res) => {
      try {
        const { email, role, isVerified, excludeAdmin } = req.query;

        const query = {};
        if (email) {
          query.email = email;
        }

        if (excludeAdmin === "true") {
          if (!role) {
            query.role = { $ne: "Admin" };
          } else {
            query.role = role;
          }
        } else if (role) {
          query.role = role;
        }

        if (isVerified !== undefined) {
          query.isVerified = JSON.parse(isVerified);
        }

        if (email && !role && isVerified === undefined) {
          const user = await usersCollection.findOne({ email });
          return res.status(200).send(user || {});
        }

        const users = await usersCollection.find(query).toArray();
        res.status(200).send(users || []);
      } catch (error) {
        res.status(500).send({ error: "Failed to retrieve users" });
      }
    });

    app.get("/users/:id/details", async (req, res) => {
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

    app.patch("/users/:id/update-verification", async (req, res) => {
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
    });

    app.patch("/users/:id/fire", async (req, res) => {
      try {
        const { id } = req.params;
        const filter = { _id: new ObjectId(id) };
        const updateStatus = { $set: { status: "fired", role: "HR" } };

        const updated = await usersCollection.updateOne(filter, updateStatus);

        res.send(updated);
      } catch (error) {
        res.status(500).send({ error: "Failed to fire the user" });
      }
    });

    app.patch("/users/:id/make-hr", async (req, res) => {
      try {
        const { id } = req.params;
        const filter = { _id: new ObjectId(id) };
        const updateRole = { $set: { role: "HR" } };

        const updated = await usersCollection.updateOne(filter, updateRole);
        res.send(updated);
      } catch (error) {
        res.status(500).send({ error: "Failed to update role" });
      }
    });

    /** ----------------------tasks api----------------------**/
    app.post("/work-sheet", async (req, res) => {
      try {
        const task = req.body;
        task.hours = parseInt(task.hours);
        const result = await tasksCollection.insertOne(task);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add task" });
      }
    });

    app.get("/work-sheet", async (req, res) => {
      try {
        const email = req.query.email;

        const query = email ? { created_by: email } : {};
        const task = await tasksCollection
          .find(query)
          .sort({ date: -1 })
          .toArray();

        res.status(200).send(task || {});
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tasks" });
      }
    });

    app.put("/work-sheet/:id", async (req, res) => {
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
    });

    app.delete("/work-sheet/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await tasksCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete task" });
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
    app.post("/payment", async (req, res) => {
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

    app.get("/payments", async (req, res) => {
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
