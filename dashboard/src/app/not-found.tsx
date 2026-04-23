import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-gray-800">Sayfa bulunamadi</h1>
      <Link href="/" className="text-blue-600 hover:underline">
        Ana sayfaya don
      </Link>
    </div>
  );
}
