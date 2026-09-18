import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, AlertCircle } from "lucide-react";
import VGitLogo from "../../components/common/VGitLogo";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { useAuth } from "../../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Invalid email format";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await signup(form.username.trim(), form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-8">
      {/* Logo */}
      <Link
        to="/login"
        className="mb-8 flex items-center gap-3 group"
      >
        <VGitLogo
          size={44}
          className="group-hover:scale-105"
        />

        <span className="text-3xl font-bold tracking-tight text-fg">
          VGIT
        </span>
      </Link>

      {/* Signup card */}
      <div className="card-surface w-full max-w-md p-6 rounded-2xl border border-border shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-fg">
          Create your VGIT account
        </h1>

        <p className="mb-6 text-sm text-fg-muted">
          Join the developer community.
        </p>

        {serverError && (
          <div className="mb-4 flex items-center gap-2 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Choose a username"
            icon={User}
            error={errors.username}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="alex@example.com"
            icon={Mail}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            icon={Lock}
            error={errors.password}
            required
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            icon={Lock}
            error={errors.confirmPassword}
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>

      {/* Login link */}
      <p className="mt-6 text-sm text-fg-muted">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-accent-blue hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}