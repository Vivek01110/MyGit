import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, CheckCircle } from "lucide-react";
import VGitLogo from "../../components/common/VGitLogo";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-8">
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

      <div className="card-surface w-full max-w-sm p-6 rounded-2xl border border-border shadow-xl">
        {submitted ? (
          <div className="py-4 text-center">
            <CheckCircle
              size={48}
              aria-hidden="true"
              className="mx-auto mb-4 text-accent-green"
            />

            <h1 className="mb-2 text-lg font-semibold text-fg">
              Check your email
            </h1>

            <p className="mb-6 text-sm text-fg-muted">
              If an account exists for{" "}
              {email || "your email"}, we've sent
              instructions to reset your password.
            </p>

            <Button
              variant="secondary"
              to="/login"
              className="w-full"
            >
              Back to login
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-semibold text-fg">
              Reset your password
            </h1>

            <p className="mb-6 text-sm text-fg-muted">
              Enter your email and we'll send you a reset link.
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="alex@example.com"
                icon={Mail}
                required
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
              >
                Send reset link
              </Button>
            </form>
          </>
        )}
      </div>

      {/* Back to login */}
      <p className="mt-6 text-sm text-fg-muted">
        <Link
          to="/login"
          className="text-accent-blue hover:underline"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}