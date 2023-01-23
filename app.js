const { default: BigNumber } = require("bignumber.js");
const { ethers } = require("ethers");
const { parseEther, formatEther, formatUnits } = require("ethers/lib/utils");
const express = require("express");
const { type } = require("express/lib/response");
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

const getTeamControlledWalletBalance = async () => {
  const sum = [];
  const addresses = [
    "0x38a294f69ce947573bea45d94fbc450109fabbb5",
    "0xee8d0803ab1fc744318a12499fdd41fcf43e344d",
    "0x2c0d93cbcafcd531de0f7c649e3bc22b9a95a143",
    "0x992cd46dfe21377bef5a5178f8b8349de2c37453",
  ];

  const abi = ["function balanceOf(address) view returns (uint)"];
  const provider = "https://bsc-dataseed1.binance.org/";
  const mcontentContract = new ethers.Contract(
    MCONTENT_CONTRACT_ADDRESS,
    abi,
    new ethers.providers.JsonRpcProvider(provider)
  );

  for (const address of addresses) {
    const balance = await mcontentContract.balanceOf(address);

    sum.push(balance.div(10 ** 6).toNumber());
  }

  let total = 0;

  for (const s of sum) {
    total += s;
  }

  return total;
};

app.get("/", async (req, res) => {
  res.send("Health Check!");
});

app.get("/api/total-supply", async (req, res) => {
  const total = new BigNumber(1e16); //10_000_000_000_000_000
  const OxbalanceWei = await getOxBalanceByContract();
  const Oxbalance = OxbalanceWei.div(10 ** 6).toNumber(); //4_108_371_491_667_972
  const team = await getTeamControlledWalletBalance();

  //Subtract team controlled wallet balance
  let supply = total.minus(team);

  //Subtract 0x balance
  supply = supply.minus(Oxbalance);

  res.send(supply.toString());
});

app.get("/api/circulating-supply", async (req, res) => {
  const response = await getCirculatingSupply();
  const balanceWei = await getOxBalanceByContract();
  const balance = balanceWei.div(10 ** 6);

  const supply = new BigNumber(response.result);

  res.send((supply - balance).toString());
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// Export the Express API
module.exports = app;
