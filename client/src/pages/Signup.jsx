import Header from "../components/layout/ResidentHeader";
import Signup from "../components/users/residents/Signup";
import ThemeToggle from "../components/forms/ThemeToggle";

export default function SignupPage() {
  return (
    <div className="m-0 p-0">
            <span><ThemeToggle />{"<--Click here to see a magic"}</span>
    <div className="min-h-screen bg-background text-text flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Header
          heading="Signup to create an account"
          paragraph="Already have an account? "
          linkName="Login"
          linkUrl="/resident-login"
        />
        <Signup />
      </div>
    </div>
    </div>
  );
}