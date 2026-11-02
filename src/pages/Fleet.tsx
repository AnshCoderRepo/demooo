import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bus, BusDocument, BusStatus } from '../types';
import { formatDate, formatINR, exportToCSV } from '../utils/formatters';
import { 
  Truck, Search, Plus, Download, Edit, ShieldAlert, 
  CheckCircle2, Clock, Wrench, AlertTriangle, Eye, History, X 
} from 'lucide-react';

export const Fleet: React.FC = () => {
  const { buses, updateBus, openHistory, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  const [editStatus, setEditStatus] = useState<BusStatus>('Available');
  const [editOdometer, setEditOdometer] = useState<number>(140000);
  const [editNextService, setEditNextService] = useState<string>('2026-11-20');

  const filteredBuses = buses.filter((b) => {
    const matchesSearch = 
      b.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (bus: Bus) => {
    setEditingBus(bus);
    setEditStatus(bus.status);
    setEditOdometer(bus.odometerKm);
    setEditNextService(bus.nextServiceDate);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBus) return;
    updateBus(editingBus.id, {
      status: editStatus,
      odometerKm: Number(editOdometer),
      nextServiceDate: editNextService,
    }, `Updated fleet status to ${editStatus}, odometer to ${editOdometer} km`);
    setIsEditModalOpen(false);
    setEditingBus(null);
  };

  const handleRenewDocument = (busId: string, docType: string) => {
    const bus = buses.find((b) => b.id === busId);
    if (!bus) return;
    const updatedDocs = bus.documents.map((d) => {
      if (d.type === docType) {
        return {
          ...d,
          expiryDate: '2027-11-02',
          status: 'valid' as const,
        };
      }
      return d;
    });
    updateBus(busId, { documents: updatedDocs }, `Renewed ${docType} certificate for 1 year`);
    showToast({ type: 'success', title: `${docType} Certificate Renewed!`, message: 'Status updated to Valid (2027).' });
  };

  const handleExportCSV = () => {
    const headers = ['Registration', 'Model', 'Type', 'Capacity', 'Status', 'Odometer KM', 'Next Service', 'Insurance Expiry', 'Fitness Expiry'];
    const rows = filteredBuses.map((b) => [
      b.plateNumber,
      b.model,
      b.type,
      b.capacity,
      b.status,
      b.odometerKm,
      b.nextServiceDate,
      b.documents.find(d => d.type === 'Insurance')?.expiryDate || 'N/A',
      b.documents.find(d => d.type === 'Fitness')?.expiryDate || 'N/A',
    ]);
    exportToCSV('Fleet_Vehicles_Report', headers, rows);
    showToast({ type: 'success', title: 'Fleet Register CSV Exported' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Fleet Management (8 Luxury Buses)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Active Vehicles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete vehicle compliance tracking: RC, Bajaj Insurance, RTO Fitness, PUC, and All-India Tourist Permits with traffic light status chips.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Fleet Register</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search plate #, model, sleeper/seater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium"
        >
          <option value="all">All Fleet Statuses</option>
          <option value="Available">Available for Dispatch</option>
          <option value="On trip">On Road (Active Trip)</option>
          <option value="In maintenance">In Maintenance / Workshop</option>
        </select>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBuses.map((bus) => {
          const expiredDoc = bus.documents.find((d) => d.status === 'expired');
          const expiringDoc = bus.documents.find((d) => d.status === 'expiring');

          return (
            <div
              key={bus.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-amber-400 transition-all group"
            >
              {/* Bus Photo / Image */}
              <div className="relative h-36 bg-slate-900 overflow-hidden">
                <img
                  src={bus.photoUrl}
                  alt={bus.model}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900/90 text-amber-400 border border-slate-700 shadow-md">
                    {bus.plateNumber}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${
                    bus.status === 'Available'
                      ? 'bg-emerald-500 text-white'
                      : bus.status === 'On trip'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {bus.status}
                  </span>
                </div>
              </div>

              {/* Specs Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{bus.model}</h3>
                  <p className="text-xs text-slate-500">{bus.type} • {bus.capacity} Passengers</p>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 p-2 bg-slate-50 rounded-xl text-[11px] border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Odometer:</span>
                      <strong className="font-mono text-slate-800">{bus.odometerKm.toLocaleString('en-IN')} km</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Next Service:</span>
                      <strong className="text-slate-800">{formatDate(bus.nextServiceDate)}</strong>
                    </div>
                  </div>
                </div>

                {/* Traffic-Light Document Expiry Chips */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Statutory Documents ({bus.documents.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {bus.documents.slice(0, 5).map((doc) => (
                      <span
                        key={doc.id}
                        title={`${doc.type} expires on ${formatDate(doc.expiryDate)}`}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                          doc.status === 'expired'
                            ? 'bg-rose-500 text-white border-rose-600 animate-bounce'
                            : doc.status === 'expiring'
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {doc.type} {doc.status === 'expired' ? '⚠️ EXPIRED' : doc.status === 'expiring' ? '⏳ 7D' : '✓'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expiry Warning Callout if needed */}
                {expiredDoc && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center justify-between">
                    <span><strong>{expiredDoc.type} Expired!</strong></span>
                    <button
                      onClick={() => handleRenewDocument(bus.id, expiredDoc.type)}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px]"
                    >
                      Renew
                    </button>
                  </div>
                )}

                {/* Action Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedBus(bus)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Detail</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openHistory('Bus', bus.id, bus.plateNumber)}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100"
                      title="Audit History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(bus)}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100"
                      title="Edit Fleet Status"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bus Detail Drawer */}
      {selectedBus && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black font-mono text-slate-900">{selectedBus.plateNumber}</h3>
                <p className="text-xs text-slate-500">{selectedBus.model}</p>
              </div>
              <button onClick={() => setSelectedBus(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* All Statutory Documents Detail */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              All Mandatory RTO Certificates
            </h4>
            <div className="space-y-2 mb-6">
              {selectedBus.documents.map((d) => (
                <div key={d.id} className="p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{d.type} Certificate</div>
                    <div className="font-mono text-slate-500 text-[11px]">{d.number}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Expiry Date: <strong>{formatDate(d.expiryDate)}</strong>
                    </div>
                  </div>
                  <div>
                    {d.status === 'expired' ? (
                      <button
                        onClick={() => handleRenewDocument(selectedBus.id, d.type)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                      >
                        Renew Now
                      </button>
                    ) : d.status === 'expiring' ? (
                      <button
                        onClick={() => handleRenewDocument(selectedBus.id, d.type)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                      >
                        Renew Due
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Valid ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Service & Workshop Records */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Maintenance & Workshop History
            </h4>
            <div className="space-y-2 mb-6 text-xs">
              {selectedBus.serviceHistory.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{formatDate(s.date)} ({s.km.toLocaleString()} km)</span>
                    <span className="font-mono">{formatINR(s.cost)}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{s.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedBus(null)}
              className="mt-auto w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close Bus Specs
            </button>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {isEditModalOpen && editingBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Update Status • {editingBus.plateNumber}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Operational Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="Available">Available (Ready in Yard)</option>
                  <option value="On trip">On trip (Active on Highway)</option>
                  <option value="In maintenance">In maintenance (Workshop)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Current Odometer (km)</label>
                <input
                  type="number"
                  value={editOdometer}
                  onChange={(e) => setEditOdometer(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Next Scheduled Service Date</label>
                <input
                  type="date"
                  value={editNextService}
                  onChange={(e) => setEditNextService(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Save Fleet Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
