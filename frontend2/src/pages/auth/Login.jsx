import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Mail, Lock } from "lucide-react";
import VGitLogo from "../../components/common/VGitLogo";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      {/* Logo */}
      <Link
        to="/login"
        className="mb-8 flex items-center gap-2.5 group"
      >
        <VGitLogo
          size={42}
          className="group-hover:scale-105"
        />

        <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
          VGit
        </span>
      </Link>

      {/* Login card */}
      <div className="card-surface w-full max-w-sm p-6 rounded-2xl border border-border shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-fg">
          Sign in to VGit
        </h1>

        <p className="mb-6 text-sm text-fg-muted">
          Welcome back! Please enter your details.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Email or Username"
            name="email"
            type="text"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="alex@example.com"
            icon={Mail}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
            icon={Lock}
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>

      {/* Signup link */}
      <p className="mt-6 text-sm text-fg-muted">
        New to VGit?{" "}
        <Link
          to="/signup"
          className="text-accent-blue hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}