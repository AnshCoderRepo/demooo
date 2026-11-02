const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Settings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add inputs for phone2, logoUrl in Business & Tax Registration section
const phone1Target = `<div>
                  <label className="block text-slate-600 mb-1">Primary Mobile Helpline *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone1}
                    onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>`;

const phone1Replacement = `<div>
                  <label className="block text-slate-600 mb-1">Primary Mobile Helpline *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone1}
                    onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Alternate Office Phone</label>
                  <input
                    type="text"
                    value={formData.phone2 || ''}
                    onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>`;

content = content.replace(phone1Target, phone1Replacement);

// Add Document Number Series Prefixes & Bank Details before Terms section
const termsSectionTarget = `{/* Terms and Cancellation Policy */}`;

const newSections = `{/* Document Number Series & Number Prefixes */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px] block">
                Official Document Number Prefixes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Ticket Prefix</label>
                  <input
                    type="text"
                    value={formData.prefixSettings?.ticket || 'DR-TK-'}
                    onChange={(e) => setFormData({
                      ...formData,
                      prefixSettings: { ...formData.prefixSettings, ticket: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Receipt Prefix</label>
                  <input
                    type="text"
                    value={formData.prefixSettings?.receipt || 'DR-REC-'}
                    onChange={(e) => setFormData({
                      ...formData,
                      prefixSettings: { ...formData.prefixSettings, receipt: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={formData.prefixSettings?.invoice || 'DR-INV-'}
                    onChange={(e) => setFormData({
                      ...formData,
                      prefixSettings: { ...formData.prefixSettings, invoice: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Charter Prefix</label>
                  <input
                    type="text"
                    value={formData.prefixSettings?.charter || 'DR-CH-'}
                    onChange={(e) => setFormData({
                      ...formData,
                      prefixSettings: { ...formData.prefixSettings, charter: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Bank & UPI QR Payment Gateway Details */}
            <div className="space-y-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
              <span className="font-bold uppercase tracking-wider text-emerald-950 text-[11px] block flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Bank Account & UPI Payment QR
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Bank Name & Branch</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.bankName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">UPI ID (e.g. deepakraj@sbi)</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.upiId || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accNo || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accNo: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.ifsc || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, ifsc: e.target.value.toUpperCase() }
                    })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Cancellation Policy */}`;

content = content.replace(termsSectionTarget, newSections);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Settings.tsx!');

