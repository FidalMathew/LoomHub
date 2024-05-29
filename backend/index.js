const { PythonShell } = require("python-shell");
const axios = require("axios");
const fs = require("fs");
const express = require("express");

const app = express();
const port = process.env.PORT || 8000;

const getTokenDetailsLatest = async (symbol) => {
  // https://uniswapv2.powerloom.io/api/last_finalized_epoch/aggregate_24h_stats_lite:9fb408548a732c85604dacb9c956ffc2538a3b895250741593da630d994b1f27:UNISWAPV2

  let url = `https://uniswapv2.powerloom.io/api/last_finalized_epoch/aggregate_24h_stats_lite:9fb408548a732c85604dacb9c956ffc2538a3b895250741593da630d994b1f27:UNISWAPV2`;

  //   get using axios
  try {
    const res = await axios.get(url);
    console.log(res.data);
    const latest_epochId = res.data.epochId;

    const tokenDetails = await axios.get(
      `https://uniswapv2.powerloom.io/api/data/${latest_epochId}/aggregate_24h_top_tokens_lite:9fb408548a732c85604dacb9c956ffc2538a3b895250741593da630d994b1f27:UNISWAPV2/`
    );

    console.log(tokenDetails.data);

    const tokens = tokenDetails.data.tokens;

    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];

      if (token.symbol === symbol) {
        console.log(token);
        break;
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const getTokenPrice = async (num, symbol) => {
  let url = `https://uniswapv2.powerloom.io/api/last_finalized_epoch/aggregate_24h_stats_lite:9fb408548a732c85604dacb9c956ffc2538a3b895250741593da630d994b1f27:UNISWAPV2`;

  //   get using axios

  const res = await axios.get(url);
  console.log(res.data);
  const latest_epochId = res.data.epochId;
  let priceRecords = [];

  for (let i = latest_epochId; i > latest_epochId - num; i--) {
    const tokenDetails = await axios.get(
      `https://uniswapv2.powerloom.io/api/data/${i}/aggregate_24h_top_tokens_lite:9fb408548a732c85604dacb9c956ffc2538a3b895250741593da630d994b1f27:UNISWAPV2/`
    );

    if (tokenDetails.data.tokens.length > 0) {
      const tokens = tokenDetails.data.tokens;

      for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];

        if (token.symbol === symbol) {
          console.log(token.price, "price");
          priceRecords.push(i, token.price);
          break;
        }
      }
    } else {
      num++;
    }
  }

  console.log(priceRecords, "price records");
};

app.get("/getTokenDetailsLatest", async (req, res) => {
  const symbol = req.query.symbol;
  const tokenDetails = await getTokenDetailsLatest(symbol);
  res.send(tokenDetails);
});

app.get("/getTokenPrice", async (req, res) => {
  const num = req.query.num;
  const symbol = req.query.symbol;
  const tokenPrice = await getTokenPrice(num, symbol);
  res.send(tokenPrice);
});

app.get("/initializeProject", async (req, res) => {
  const pythonScriptContent = ``;

  const pythonFilePath = "python_scripts/hello.py";

  // Write the content to the Python file
  fs.writeFile(pythonFilePath, pythonScriptContent, (err) => {
    if (err) {
      console.error("Error creating Python file:", err);
    } else {
      console.log("Python file created successfully!");
    }
  });
});

app.post("/runPythonScript", async (req, res) => {
  // const pythonFilePath = "python_scripts/hello.py";
  const pythonFilePath = req.query.pythonFilePath;

  PythonShell.run(pythonFilePath, null).then((messages) => {
    console.log(messages, "finished");
    res.send(messages);
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
