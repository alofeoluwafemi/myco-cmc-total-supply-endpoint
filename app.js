const { default: BigNumber } = require("bignumber.js");
const { ethers } = require("ethers");
const express = require("express");
const app = express();
const port = 3000;

require("dotenv").config();

const BSC_KEY = process.env.BSC_KEY;
const MCONTENT_CONTRACT_ADDRESS = process.env.MCONTENT_CONTRACT_ADDRESS;
const T_SUPPLY_API = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${MCONTENT_CONTRACT_ADDRESS}&apikey=${BSC_KEY}`;
const C_SUPPLY_API = `https://api.bscscan.com/api?module=stats&action=tokenCsupply&contractaddress=${MCONTENT_CONTRACT_ADDRESS}&apikey=${BSC_KEY}`;
const BALANCE_API = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${MCONTENT_CONTRACT_ADDRESS}&address=0x0000000000000000000000000000000000000000&tag=latest&apikey=${BSC_KEY}`;

const toFixed = (x) => {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = "0." + new Array(e).join("0") + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join("0");
    }
  }

  console.log(typeof x, parseInt(x));
  return x;
};

const getTotalSupply = async () => {
  const response = await fetch(T_SUPPLY_API);
  const data = await response.json();
  return data;
};

const getCirculatingSupply = async () => {
  const response = await fetch(C_SUPPLY_API);
  const data = await response.json();
  return data;
};

const get0xBalance = async () => {
  const response = await fetch(BALANCE_API);
  const data = await response.json();
  return data;
};

const getOxBalanceByContract = async () => {
  const abi = ["function balanceOf(address) view returns (uint)"];
  const provider = "https://bsc-dataseed1.binance.org/";
  const mcontentContract = new ethers.Contract(
    MCONTENT_CONTRACT_ADDRESS,
    abi,
    new ethers.providers.JsonRpcProvider(provider)
  );

  const balance = await mcontentContract.balanceOf(
    "0x000000000000000000000000000000000000dead"
  );
  return balance;
};

app.get("/api/total-supply", async (req, res) => {
  const response = await getTotalSupply();
  const balance = await getOxBalanceByContract();

  const supply = new BigNumber(response.result);

  res.send(supply.minus(balance.toString()).toFixed());
});

app.get("/api/circulating-supply", async (req, res) => {
  const response = await getCirculatingSupply();
  const balance = await getOxBalanceByContract();

  const supply = new BigNumber(response.result);

  res.send(supply.minus(balance.toString()).toFixed());
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});