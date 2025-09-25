import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          MakeMeGuud.LinkedIn
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Your Personal AI Coach for a World-Class LinkedIn Profile. Turn your achievements into opportunities with actionable, data-driven advice.
        </p>
        <Link 
          href="/login" 
          className="px-10 py-4 font-semibold text-lg bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-transform duration-300 ease-in-out"
        >
          Get Started for Free
        </Link>
      </div>
      <footer className="absolute bottom-8 text-gray-500">
        <p>Built to help you shine.</p>
      </footer>
    </main>
  );
}