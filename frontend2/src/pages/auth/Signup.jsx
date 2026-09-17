import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GitFork, User, Mail, Lock, AlertCircle } from "lucide-react";
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await signup(form.username.trim(), form.email.trim(), form.password);
        navigate("/dashboard");
      } catch (err) {
        setServerError(err.message || "Failed to create account. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-8">
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

      {/* Signup card */}
      <div className="card-surface w-full max-w-md p-6">
        <h1 className="mb-1 text-xl font-semibold text-fg">
          Create your account
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