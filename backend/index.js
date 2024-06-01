const { PythonShell } = require("python-shell");
const axios = require("axios");
const fs = require("fs");
const express = require("express");

const lighthouse = require("@lighthouse-web3/sdk");

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
  // create a ipns record for the project
  // return back the ipns record name to the user
  try {
    const keyResponse = await lighthouse.generateKey(apiKey);
    const ipnsName = keyResponse.data.ipnsId;

    const pythonScriptContent = ``;
    const pythonFilePath = `python_scripts/${ipnsName}.py`;

    // Write the content to the Python file
    fs.writeFile(pythonFilePath, pythonScriptContent, (err) => {
      if (err) {
        console.error("Error creating Python file:", err);
      } else {
        console.log("Python file created successfully!");
      }
    });

    return res.status(200).json({ ipnsName: ipnsName });
  } catch (error) {
    return res.status(404).json({ error: error });
  }
});

app.post("/runPythonScript", async (req, res) => {
  try {
    const ipnsName = req.body.ipnsName;
    const pythonFilePath = `python_scripts/${ipnsName}`;

    const pythonScriptContent = req.body.pythonScriptContent;

    fs.writeFile(pythonFilePath, pythonScriptContent, (err) => {
      if (err) {
        console.error("Error creating Python file:", err);
      } else {
        console.log("Python file created successfully!");
      }
    });

    PythonShell.run(pythonFilePath, null).then((messages) => {
      console.log(messages, "finished");
      res.send(messages);
    });
  } catch (error) {
    return res.status(404).json({ error: error });
  }
});

app.post("/publish", async (req, res) => {
  try {
    const ipnsName = req.body.ipnsName;
    const pythonFilePath = `python_scripts/${ipnsName}`;

    const uploadResponse = await lighthouse.upload(
      pythonFilePath,
      process.env.LIGHTHOUSE_API_KEY
    );

    const ipfsHash = uploadResponse.data.Hash;

    const pubResponse = await lighthouse.publishRecord(
      ipfsHash, // replace with your IPFS hash
      ipnsName,
      process.env.LIGHTHOUSE_API_KEY
    );

    return res.status(200).json({ ipnsName: ipnsName });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
});

const fetchData = async () => {
  try {
    let url = `https://uniswapv2.powerloom.io/api/last_finalized_epoch/aggregate_24h_stats_lite:9fb408548a732c85604dacb9c956ffc2538a3b895250741593da630d994b1f27:UNISWAPV2`;

    const res = await axios.get(url);
    console.log(res.data);
  } catch (error) {
    console.log(error);
  }
};

// Schedule the task to run every 5 minutes
cron.schedule("*/5 * * * *", fetchData);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
