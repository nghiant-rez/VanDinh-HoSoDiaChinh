'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Map as MapIcon, History, FileDown, GitMerge } from 'lucide-react';
import { GenealogyTimeline } from '@/components/hoso/GenealogyTimeline';
import { MapView } from '@/components/map/MapView';

export default function DossierDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'history'>('map');

  const [lineageData, setLineageData] = useState<any[]>([]);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'map' && dossier?.thua_dat && !geojsonData) {
      setMapLoading(true);
      fetch(`http://localhost:8000/api/gis/parcels?so_thua=${dossier.thua_dat.sothua}&to_ban_do=${dossier.thua_dat.tobando}`, { headers: { 'x-user-id': '1' } })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          setGeojsonData(data);
          setMapLoading(false);
        })
        .catch(err => {
          console.error('Lỗi tải bản đồ:', err);
          setMapLoading(false);
        });
    }
  }, [activeTab, dossier, geojsonData]);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const [res, lineageRes] = await Promise.all([
          fetch(`http://localhost:8000/api/hoso/${id}`, { headers: { 'x-user-id': '1' } }),
          fetch(`http://localhost:8000/api/hoso/${id}/lineage`, { headers: { 'x-user-id': '1' } })
        ]);
        
        if (res.ok) {
          const data = await res.json();
          setDossier(data);
        }
        
        if (lineageRes.ok) {
          const lineage = await lineageRes.json();
          const formattedLineage = [];
          
          if (lineage.parent) {
            formattedLineage.push({
              id: lineage.parent.id,
              mahoso: lineage.parent.mahoso,
              tenhoso: lineage.parent.tenhoso,
              loailienket: 'Hồ sơ cha',
              date: lineage.parent.trangthai
            });
          }
          
          // Current dossier
          formattedLineage.push({
             id: Number(id),
             mahoso: '', // will be filled in render if needed, or we rely on dossier state
             tenhoso: 'Hồ sơ hiện tại',
             loailienket: 'Hiện tại',
             date: '',
             isCurrent: true
          });
          
          lineage.children.forEach((child: any) => {
            formattedLineage.push({
              id: child.id,
              mahoso: child.mahoso,
              tenhoso: child.tenhoso,
              loailienket: 'Hồ sơ con',
              date: child.trangthai
            });
          });
          
          setLineageData(formattedLineage);
        }
      } catch (error) {
        console.error('Lỗi tải chi tiết hồ sơ:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDossier();
  }, [id]);



  if (loading) return <div className="flex h-full items-center justify-center">Đang tải dữ liệu hồ sơ...</div>;
  if (!dossier) return <div className="flex h-full items-center justify-center text-red-500">Không tìm thấy hồ sơ!</div>;

  const primaryAttachment = dossier.attachments && dossier.attachments.length > 0 ? dossier.attachments[0] : null;

  // Cập nhật current dossier trong lineage
  const finalLineage = lineageData.map(l => 
    l.isCurrent ? { ...l, mahoso: dossier.mahoso, tenhoso: dossier.tenhoso, date: dossier.trangthai } : l
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {dossier.tenhoso}
            </h1>
            <p className="text-sm text-slate-500">Mã hồ sơ: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{dossier.mahoso}</span></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {primaryAttachment && (
            <a 
              href={`http://localhost:8000/static/${primaryAttachment.storagepath}`} 
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <FileDown className="w-4 h-4" /> Tải PDF gốc
            </a>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <History className="w-4 h-4" /> Lịch sử biến động
          </button>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: PDF Viewer */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-100 p-4">
          <div className="bg-white rounded-t-lg border border-slate-200 border-b-0 px-4 py-2 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              Tài liệu Scan gốc
            </div>
            <div className="flex items-center gap-2">
              {primaryAttachment && (
                <span className="text-xs text-slate-500">{primaryAttachment.documentname}</span>
              )}
            </div>
          </div>
          <div className="flex-1 bg-slate-200 border border-slate-200 rounded-b-lg overflow-hidden flex items-center justify-center relative shadow-inner">
            {primaryAttachment ? (
              ['.pdf', '.jpg', '.jpeg', '.png'].includes(primaryAttachment.extension?.toLowerCase()) ? (
                // Sử dụng thẻ object hoặc iframe để nhúng PDF trực tiếp từ backend (hoặc localhost) một cách tinh gọn
                <object 
                  data={`http://localhost:8000/static/${primaryAttachment.storagepath}`}
                  type={primaryAttachment.extension?.toLowerCase() === '.pdf' ? "application/pdf" : `image/${primaryAttachment.extension?.replace('.', '')}`}
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <FileText className="w-12 h-12 mb-2 text-slate-300" />
                    <p>Trình duyệt không hỗ trợ xem trực tiếp.</p>
                    <a href={`http://localhost:8000/static/${primaryAttachment.storagepath}`} className="text-indigo-600 hover:underline mt-2">Vui lòng tải xuống file</a>
                  </div>
                </object>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 bg-white p-8 rounded-xl border border-slate-200 shadow-sm m-4 text-center">
                  <FileDown className="w-16 h-16 mb-4 text-indigo-300" />
                  <p className="font-medium text-slate-700 mb-2">Trình duyệt không hỗ trợ xem trước định dạng {primaryAttachment.extension || 'này'}</p>
                  <p className="text-sm mb-4">Vui lòng tải file về máy để xem nội dung.</p>
                  <a 
                    href={`http://localhost:8000/static/${primaryAttachment.storagepath}`} 
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <FileDown className="w-4 h-4" /> Tải xuống file gốc
                  </a>
                </div>
              )
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <FileText className="w-16 h-16 mb-4 text-slate-300" />
                Hồ sơ này chưa có bản scan đính kèm.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: OCR Text / GIS Map */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar">

            <button 
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'map' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
            >
              <MapIcon className="w-4 h-4" /> Vị trí Thửa đất
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
            >
              <GitMerge className="w-4 h-4" /> Gia phả Hồ sơ
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">


            {activeTab === 'map' && (
              <div className="h-full w-full relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                {mapLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white/80 z-10">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p>Đang tải dữ liệu bản đồ...</p>
                  </div>
                )}
                {!mapLoading && (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white z-10">
                    <MapIcon className="w-16 h-16 mb-4 text-slate-300" />
                    <p>Không có dữ liệu không gian cho thửa đất này.</p>
                  </div>
                )}
                {geojsonData && geojsonData.features && geojsonData.features.length > 0 && (
                  <MapView geojsonData={geojsonData} />
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <GenealogyTimeline links={finalLineage} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
