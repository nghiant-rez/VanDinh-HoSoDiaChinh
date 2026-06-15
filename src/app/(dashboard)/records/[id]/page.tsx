import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/search" className="p-2 hover:bg-bg-main rounded-full transition-colors text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-text-primary">Chi tiết hồ sơ: {resolvedParams.id}</h2>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-6">
        <p className="text-text-secondary">Trang chi tiết hồ sơ đang được phát triển...</p>
      </div>
    </div>
  );
}
