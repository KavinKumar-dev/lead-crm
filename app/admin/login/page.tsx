"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) router.push("/admin/dashboard");
    else alert("Login failed");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2 max-w-sm mx-auto">
      <h1 className="text-xl font-bold">Admin Login</h1>
      <input type="email" placeholder="Email" className="border p-2" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" className="border p-2" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" className="bg-blue-600 text-white p-2">Login</button>
    </form>
  );
}
