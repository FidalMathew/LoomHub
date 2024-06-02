const { PythonShell } = require("python-shell");
const axios = require("axios");
const fs = require("fs");
const express = require("express");
const cron = require("node-cron");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
dotenv.config();
// init cors
app.use(cors());
app.use(express.json());

const lighthouse = require("@lighthouse-web3/sdk");

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

app.post("/initializeProject", async (req, res) => {
  // create a ipns record for the project
  // return back the ipns record name to the user
  try {
    console.log("Generating key", process.env.LIGHTHOUSE_API_KEY);
    const keyResponse = await lighthouse.generateKey(
      process.env.LIGHTHOUSE_API_KEY
    );

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
    console.log(error);
    return res.status(404).send(error);
  }
});

app.post("/runPythonScript", async (req, res) => {
  try {
    console.log("req-", req.body);
    const ipnsName = req.body.ipnsName;
    const pythonFilePath = `python_scripts/${ipnsName}.py`;

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
    const pythonFilePath = `python_scripts/${ipnsName}.py`;

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

    return res.status(200).json({ ipnsName: ipnsName, ipfsHash: ipfsHash });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
});

app.get("/getIpnsRecord", async (req, res) => {
  try {
    const ipnsName = req.query.ipnsName;

    const allKeys = await lighthouse.getAllKeys(process.env.LIGHTHOUSE_API_KEY);

    for (let i = 0; i < allKeys.data.length; i++) {
      const element = allKeys.data[i];

      if (element.ipnsId === ipnsName) {
        return res.status(200).json({
          cid: element.cid,
          ipnsId: element.ipnsId,
          ipnsName: element.ipnsName,
        });
      }
    }

    return res.status(404).json({ error: "IPNS record not found" });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
});

app.get("/getFileContent", async (req, res) => {
  try {
    const ipnsName = req.query.ipnsName;
    // read file content using fs
    const data = fs.readFileSync(`python_scripts/${ipnsName}.py`, "utf8");
    console.log(data);

    return res.status(200).json({ content: data });
  } catch (error) {
    console.log(error);
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
// cron.schedule("*/5 * * * *", fetchData);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
