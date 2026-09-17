import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GitFork, Mail, Lock, AlertCircle } from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      {/* Logo */}
      <Link
        to="/login"
        className="mb-8 flex items-center gap-2"
      >
        <GitFork
          size={32}
          aria-hidden="true"
          className="text-fg"
        />

        <span className="text-2xl font-semibold text-fg">
          DevHub
        </span>
      </Link>

      {/* Login card */}
      <div className="card-surface w-full max-w-sm p-6">
        <h1 className="mb-1 text-xl font-semibold text-fg">
          Sign in to DevHub
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
        New to DevHub?{" "}
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