export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#008751] flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">CC</span>
        </div>
        <h1 className="text-3xl font-bold text-[#008751]">Corpers Connect</h1>
        <p className="text-gray-500 mt-1 text-sm">Connecting Nigeria&apos;s Corps Members</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-6">Sign in with your state code or email</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State Code / Email
            </label>
            <input
              type="text"
              placeholder="e.g. KG/25C/1358"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
            />
          </div>
          <button className="w-full bg-[#008751] hover:bg-[#006b3f] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
            Sign In
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          New corps member?{' '}
          <span className="text-[#008751] font-medium cursor-pointer hover:underline">
            Create account
          </span>
        </p>
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center">
        © {new Date().getFullYear()} Corpers Connect · For NYSC corps members only
      </p>
    </div>
  );
}
