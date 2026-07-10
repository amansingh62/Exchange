"use client";

import api from "@/lib/api";
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [ balance, setBalance ] = useState();

  useEffect(() => {
    const fetchWallet = async () => {
      const res = await api.get("/api/auth/getWallet");
      setBalance(res.data.wallet.balance)
    };
    fetchWallet();
  },[]);

  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Wallet Balance</h2>
      <p>{balance}</p>
    </div>
  )
}
