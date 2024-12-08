import React from "react";

const Page404 = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200">
      {/* Content Wrapper */}
      <div className="text-center max-w-lg px-6 py-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <h1 className="text-6xl font-extrabold text-indigo-600 dark:text-indigo-400">
          404
        </h1>
        <p className="mt-4 text-lg">
          Oops! The page you’re looking for doesn’t exist.
        </p>
        <p className="text-sm mt-1">
          It seems you’ve found a broken link or entered an incorrect URL.
        </p>

        {/* Navigation Options */}
        <div className="mt-6 space-y-4">
          <a
            href="/"
            className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-md transition"
          >
            Back to Home
          </a>
          <div>
            <p className="text-sm">Need assistance?</p>
            <a
              href="/support"
              className="underline text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-500 text-sm"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* Mini Footer */}
      <footer className="mt-10 text-center text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} d3 ltd. All Rights Reserved.
        </p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="/terms" className="hover:underline">
            Terms
          </a>
          <a href="/privacy" className="hover:underline">
            Privacy
          </a>
          <a href="/help" className="hover:underline">
            Help
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Page404;
