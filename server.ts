import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { deepResearch, generateReport } from "./index";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware for parsing requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.render("index", { title: "Deep Research Tool" });
});

app.get("/research", (req, res) => {
  res.render("research", {
    title: "Research Results",
    research: null,
    report: null,
    loading: false,
  });
});

app.post("/research", async (req, res) => {
  try {
    const { query, depth, breadth } = req.body;

    // Start research
    const research = await deepResearch(
      query,
      parseInt(depth),
      parseInt(breadth)
    );
    const report = await generateReport(research);

    // Render the research page with results
    res.render("research", {
      title: "Research Results",
      research,
      report,
      loading: false,
    });
  } catch (error) {
    console.error("Research error:", error);
    res.render("research", {
      title: "Research Error",
      error: "An error occurred during research. Please try again.",
      loading: false,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
