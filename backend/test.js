const fetch = require("node-fetch");
const { PythonShell } = require("python-shell");

async function runPythonFromURL(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const code = await response.text();
      PythonShell.runString(code, null, function (err) {
        if (err) console.error("Failed to execute Python code:", err);
      });
    } else {
      console.error("Failed to fetch Python file from the provided URL");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Example usage
const url =
  "https://gateway.lighthouse.storage/ipfs/QmQgs5HTB1ivpZS5PesH52YcQcedeAQeAXHQjz6rznd7mj/";
runPythonFromURL(url);
