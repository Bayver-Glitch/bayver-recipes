import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bayver Recipes',
  description: 'Recipe management and meal planning system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Bayver Recipes
                </h1>
                <div className="flex gap-6">
                  <a href="/" className="text-gray-700 hover:text-gray-900">
                    Recipes
                  </a>
                  <a href="/meal-planner" className="text-gray-700 hover:text-gray-900">
                    Meal Planner
                  </a>
                  <a href="/shopping-list" className="text-gray-700 hover:text-gray-900">
                    Shopping List
                  </a>
                </div>
              </div>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
