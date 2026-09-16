'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold">404 - Not Found</h2>
        <p className="text-neutral-500 mt-2">Could not find requested resource</p>
      </div>
    </div>
  );
}
