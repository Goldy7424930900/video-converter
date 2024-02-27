const express = require("express");
const multer = require("multer");
const hbjs = require("handbrake-js");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniquePrefix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
// set the view engine to ejs
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("pages/index");
});

app.post("/upload", upload.single("uploaded_file"), (req, res) => {
  const outputFileType = ".mp4";

  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  console.log("File uploaded:", req.file);
  console.log("File path:", req.file.path);

  const outputFileName = `transcoded-${req.file.originalname}`
    .split(".")
    .slice(0, -1)
    .join(".")
    .concat(outputFileType);
  const outputPath = path.join(__dirname, "public", outputFileName);

  hbjs
    .spawn({ input: req.file.path, output: outputPath })
    .on("begin", () => {
      console.log("begin");
    })
    .on("error", (err) => {
      console.error("Error processing video:", err);
      // res.status(500).send("Error processing video.");
    })
    .on("progress", (progress) => {
      console.log(
        "Percent complete: %s, ETA: %s",
        progress.percentComplete,
        progress.eta
      );
    })
    // .on("output", (output) => {
    //   // Accumulate output in a variable if needed
    //   // For simplicity, let's ignore output events for now
    // })
    .on("end", () => {
      console.log("Video processing completed successfully.");

      // Serve the converted video
      const videoURL = `/videos/${outputFileName}`;
      res
        .status(200)
        .send(
          `Video processing completed. You can download your video <a href="${videoURL}">here</a>.`
        );
    });
});

// Serve static files from the public directory
app.use("/videos", express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
