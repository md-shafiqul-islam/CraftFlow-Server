const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

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

    // ----------------------users API----------------------
    app.post("/users", async (req, res) => {
      try {
        const userInfo = req.body;
        userInfo.salary = parseInt(userInfo.salary);
        const result = await usersCollection.insertOne(userInfo);
        res.status(201).send(result);
      } catch (error) {
        console.error("Failed to insert user:", error.message);
        res.status(500).send({ error: "Failed to add user" });
      }
    });

    app.get("/users", async (req, res) => {
      try {
        const email = req.query.email;

        if (email) {
          const user = await usersCollection.findOne({ email });
          return res.status(200).send(user || {});
        }

        const users = await usersCollection.find().toArray();
        res.status(200).send(users);
      } catch (error) {
        console.error("Failed to fetch users:", error.message);
        res.status(500).send({ error: "Failed to retrieve users" });
      }
    });

    // ----------------------tasks API----------------------
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
        console.error("Failed to fetch tasks:", error);
        res.status(500).send({ error: "Failed to fetch tasks" });
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
        console.error("Failed to delete task:", error.message);
        res.status(500).send({ error: "Failed to delete task" });
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
