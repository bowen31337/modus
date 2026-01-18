const fs = require("fs");
const features = JSON.parse(fs.readFileSync("feature_list.json", "utf8"));

// Get failing features
const failing = features.filter(f => !f.passes);
console.log("=== ALL " + failing.length + " FAILING FEATURES ===\n");

failing.forEach((f, i) => {
  console.log((i+1) + ". [" + (f.id || "N/A") + "] " + f.description);
  console.log("   Priority: " + f.priority + " | Dev: " + f.is_dev_done + " | QA: " + f.is_qa_passed);
});
