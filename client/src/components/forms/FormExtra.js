export default function FormExtra() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className="h-4 w-4 text-blue1 focus:ring-blue2 border-gray-300 rounded"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm">
          Remember me
        </label>
      </div>

      <div className="text-sm">
        <a href="/forgot-password" className="font-medium text-blue1 hover:text-blue2">
          Forgot your password?
        </a>
      </div>
    </div>
  );
}
