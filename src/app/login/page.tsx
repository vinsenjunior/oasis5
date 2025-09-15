"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simple authentication logic (in real app, use proper auth)
      //Admin
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("userRole", "admin") 
        localStorage.setItem("isAuthenticated", "true")
        router.push("/dashboard")
      } 
      // SMS
      else if (username === "sms" && password === "sms123") {
        localStorage.setItem("userRole", "sms")
        localStorage.setItem("isAuthenticated", "true")
        router.push("/dashboard")
      } 
      //Busdev
        else if (username === "busdev" && password === "busdev123") {
        localStorage.setItem("userRole", "busdev")
        localStorage.setItem("isAuthenticated", "true")
        router.push("/dashboard")
      } 
      //Guest
        else if (username === "guest" && password === "guest123") {
        localStorage.setItem("userRole", "guest")
        localStorage.setItem("isAuthenticated", "true")
        router.push("/browse-assets")
      } else {
        setError("Username atau password salah")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-800 bg-[00509e] p-4">
      <div className="space-y-4">
        <Image src="/o_logo.svg" alt="Otego Logo" width={150} height={150} className="pb-12" />
      </div>
      <div className="space-y-4 font-mono text-center text-white mb-8">
        O.A.S.I.S
        <div className="text-sm text-white pb-15">
          Otego Asset, Sales & Inventory System
        </div>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Masukkan username dan password Anda
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-gray-600">
              {/* <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Busdev:</strong> busdev / busdev123</p>
              <p><strong>Tamu:</strong> guest / guest123</p> */}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}