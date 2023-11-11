"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./contractABI";

const { ethereum } = window;

export default function Home() {
  const [account, setAccount] = useState("");
  const [transactionCount, setTransactionCount] = useState("");
  const [transactionData, setTransactionData] = useState([]);
  const [formData, setFormData] = useState({
    transactionID: 0,
    destination: "",
    value: "",
    data: "",
  });
  const { transactionID, destination, value, data } = formData;

  const checkMetamaskIsInstalled = async () => {
    if (!ethereum) return alert("Install Metamask first");
    const accounts = await ethereum.request({ method: "eth_accounts" });
    setAccount(accounts[0]);
  };

  const getEthereumContract = () => {
    const contractABI = abi.abi;
    const contractAddress = "0xEcE8654a36e583313DBf62b679C217d8245A79bE";
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    console.log({ signer, provider, transactionsContract });
    return transactionsContract;
  };

  const sendTransaction = async (e) => {
    e.preventDefault();
    if (!ethereum) return alert("Please Install Metamask");
    const parseAmount = ethers.utils.parseEther(value);
    if (!destination || !value || !data) return;
    await ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: account,
          to: destination,
          value: parseAmount._hex,
          gasLimit: 0x5028,
        },
      ],
    });
    const transcontract = getEthereumContract();
    const transactionHash = await transcontract.proposeTransaction(
      transactionID,
      destination,
      value,
      data
    );

    console.log(`loading: ${transactionHash.hash}`);
    transactionHash.wait();

    console.log(`success: ${transactionHash.hash}`);
    const transactionCount = await transcontract.getTransactionCount();
    setTransactionCount(transactionCount.toNumber());
  };

  useEffect(() => {
    checkMetamaskIsInstalled();
    getEthereumContract();

    const getTransactionData = async () => {
      try {
        const transactionHash = getEthereumContract();
        const transactionArray = await transactionHash.getTransactionList();
        console.log(transactionArray);
        const allTransactions = transactionArray.map((transaction) => ({
          key: transaction.transactionID,
          addressTo: transaction.destination ? transaction.destination : "-",
          sender: transaction.sender ? transaction.sender : "no",
          message: transaction.data,
          amount: parseInt(transaction.value._hex) / 10 ** 18,
        }));
        setTransactionData(allTransactions);
        console.log(allTransactions);
      } catch (error) {
        console.log(error);
      }
    };
    getTransactionData();
  }, []);

  const connectMetamask = async () => {
    if (typeof ethereum !== "undefined") {
      try {
        await ethereum.request({ method: "eth_requestAccounts" });
      } catch (e) {
        console.log(e);
      }
    }
  };
  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <main className="flex flex-col justify-center gap-7 items-center h-screen">
      <h1 className="text-2xl capitalize text-blue-900">
        Multi-Signature Wallet
      </h1>
      <button className="btn" onClick={connectMetamask}>
        connect Metamask
      </button>
      <form onSubmit={sendTransaction}>
        <div className="flex flex-col gap-3">
          <input
            className="input-style"
            placeholder="amount"
            name="value"
            value={value}
            onChange={onChange}
            type="number"
            step={0.001}
          />
          <input
            className="input-style"
            placeholder="ID"
            name="transactionID"
            value={transactionID}
            onChange={onChange}
            type="number"
          />
          <input
            className="input-style"
            placeholder="receiver address"
            name="destination"
            value={destination}
            onChange={onChange}
          />
          <input
            className="input-style"
            placeholder="message"
            name="data"
            value={data}
            onChange={onChange}
            type="text"
          />
        </div>
        <button type="submit" className="btn float-right w-20 m-4">
          Send
        </button>
      </form>
      <div>
        <h1>Transation Data</h1>
        <h1>Number of Transactions: {transactionCount}</h1>
        {transactionData.map((transaction) => (
          <div key={transaction.key}>
            <p>Address To: {transaction.addressTo}</p>
            <p>Sender: {transaction.sender}</p>
            <p>Message: {transaction.message}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
