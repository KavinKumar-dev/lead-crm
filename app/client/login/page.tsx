"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientLogin() {
  const [clientCode, setClientCode] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/client-login", {
      method: "POST",
      body: JSON.stringify({ clientCode, password }),
    });
    if (res.ok) router.push("/client/dashboard");
    else alert("Login failed");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2 max-w-sm mx-auto">
      <h1 className="text-xl font-bold">Client Login</h1>
      <input type="text" placeholder="Client ID (5-digit)" className="border p-2" onChange={(e) => setClientCode(e.target.value)} />
      <input type="password" placeholder="Password" className="border p-2" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" className="bg-green-600 text-white p-2">Login</button>
    </form>
  );
}
