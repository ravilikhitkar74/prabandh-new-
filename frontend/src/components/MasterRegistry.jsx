import React, { useState } from 'react';

export default function MasterRegistry({ 
  blocks = [], 
  conflicts = [],
  user,
  onSanctionBlock, 
  onExecuteShadowMerge, 
  onMarkComplete,
  isApprover = false,
  isProcessing = false, 
  lang = 'en' 
}) {
  const [filter, setFilter] = useState('ALL'); 

  const safeBlocks = Array.isArray(blocks) ? blocks : [];

  const filteredBlocks = safeBlocks.filter((b) => {
    const status = String(b?.status || '');
    if (filter === 'CONFLICT') return status === 'CONFLICT_DETECTED';
    if (filter === 'PENDING') return status === 'PENDING_SANCTION';
    if (filter === 'APPROVED') return status.includes('APPROVED') || status === 'COMPLETED'; 
    return true;
  });

  return (
    <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5 shadow-lg font-sans space-y-4 text-white">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'hi' ? `सभी अनुरोध (${safeBlocks.length})` : `All Requisitions (${safeBlocks.length})`}
          </button>
          <button
            onClick={() => setFilter('CONFLICT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filter === 'CONFLICT' ? 'bg-rose-950 border border-rose-800 text-rose-300' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'hi' ? 'ओवरलैप / टकराव' : 'Overlaps / Conflicts'}
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filter === 'PENDING' ? 'bg-amber-950 border border-amber-800 text-amber-300' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'hi' ? 'अनुमोदन की प्रतीक्षा' : 'Awaiting Sanction'}
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filter === 'APPROVED' ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'hi' ? 'सक्रिय / स्वीकृत' : 'Active / Sanctioned'}
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          {lang === 'hi' ? 'देखने का मोड: ' : 'Viewing Mode: '}{' '}
          <strong className={isApprover ? 'text-emerald-400' : 'text-blue-400'}>
            {isApprover 
              ? (lang === 'hi' ? 'ऑपरेटिंग प्राधिकारी (प्रतिबंध सक्षम)' : 'Operating Authority (Sanction Enabled)') 
              : (lang === 'hi' ? 'विभाग अनुरोध ट्रैकिंग (केवल पढ़ने के लिए)' : 'Department Requisition Tracking')}
          </strong>
        </span>
      </div>

      {/* Registry Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3">{lang === 'hi' ? 'ब्लॉक आईडी और विभाग' : 'Block ID & Dept'}</th>
              <th className="py-3 px-3">{lang === 'hi' ? 'कॉरिडोर सेक्शन और ट्रैक' : 'Corridor Section & Track'}</th>
              <th className="py-3 px-3">{lang === 'hi' ? 'कार्य प्रकृति और मशीन' : 'Work Nature & Machine'}</th>
              <th className="py-3 px-3">{lang === 'hi' ? 'विंडो और अवधि' : 'Window & Duration'}</th>
              <th className="py-3 px-3">{lang === 'hi' ? 'टीएसआर सीमा' : 'TSR Limit'}</th>
              <th className="py-3 px-3">{lang === 'hi' ? 'स्थिति और सुरक्षा टोकन' : 'Status & Safety Token'}</th>
              {isApprover ? (
                <th className="py-3 px-3 text-right">{lang === 'hi' ? 'कंट्रोलर कार्रवाई' : 'Controller Action'}</th>
              ) : (
                <th className="py-3 px-3 text-right">{lang === 'hi' ? 'विभागीय कार्रवाई' : 'Department Action'}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredBlocks.map((b) => {
              const statusStr = String(b?.status || '');
              const isConflict = statusStr === 'CONFLICT_DETECTED';
              const isPending = statusStr === 'PENDING_SANCTION';
              const isApproved = statusStr.includes('APPROVED');
              const isShadow = statusStr.includes('SHADOW');
              const isCompleted = statusStr === 'COMPLETED';

              const hasPowerCut =
                b?.power_cut === true ||
                String(b?.power_cut || '').toUpperCase().includes('YES') ||
                String(b?.ohe_power_cut || '').toUpperCase().includes('YES');

              return (
                <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                  {/* Block ID & Dept */}
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-blue-400">{b.id}</div>
                    <div className="text-[11px] text-slate-400">{b.department || (lang === 'hi' ? 'इंजीनियरिंग' : 'Engineering')}</div>
                  </td>

                  {/* Corridor Section & Track */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">{b.section}</div>
                    <div className="text-[11px] text-slate-400">{b.track}</div>
                  </td>

                  {/* Work Nature & Machine */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-300">{b.work_type}</div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span>{lang === 'hi' ? 'परसंपत्ति: ' : 'Asset: '}{b.machine || (lang === 'hi' ? 'मानक उपकरण' : 'Standard Equipment')}</span>
                      {hasPowerCut && (
                        <span className="text-rose-400 font-bold">• 25kV OHE Cut</span>
                      )}
                    </div>
                  </td>

                  {/* Window & Duration - PERMANENT DYNAMIC DATE */}
                  <td className="py-3 px-3 font-mono">
                    <div className="text-[13px] font-bold text-slate-100 mb-0.5">
                      {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-slate-300">{b.time_window}</div>
                    <div className="text-[11px] text-slate-500">{b.duration}</div>
                  </td>

                  {/* TSR */}
                  <td className="py-3 px-3 font-semibold text-amber-400 font-mono">
                    {b.tsr_speed || (lang === 'hi' ? 'सामान्य' : 'Normal')}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">
                    {isConflict && (
                      <div className="space-y-1">
                        <span className="inline-block bg-rose-950/80 border border-rose-700/60 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded">
                          {lang === 'hi' ? 'टकराव का पता चला' : 'CONFLICT DETECTED'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {lang === 'hi' ? 'कोई PN जारी नहीं किया गया' : 'No PN Issued'}
                        </div>
                      </div>
                    )}
                    
                    {isConflict && (() => {
                        const matchingConflict = conflicts.find(
                          (c) => c.block_a_id === b.id || c.block_b_id === b.id
                        );
                        return (
                          <button
                            onClick={() => matchingConflict && onExecuteShadowMerge && onExecuteShadowMerge(matchingConflict.conflict_id)}
                            disabled={!matchingConflict}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded shadow transition cursor-pointer flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                            title="Execute 1-Click AI Shadow Bundling"
                          >
                            <span>⚡</span>
                            <span>{lang === 'hi' ? 'AI शैडो मर्ज' : 'AI Shadow Merge'}</span>
                          </button>
                        );
                      })()}
                      
                    {isApproved && (
                      <div className="space-y-1">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isShadow
                            ? 'bg-blue-950/80 border-blue-700 text-blue-300'
                            : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                        }`}>
                          {isShadow 
                            ? (lang === 'hi' ? 'एकीकृत शैडो स्वीकृत' : 'INTEGRATED SHADOW APPROVED') 
                            : (lang === 'hi' ? 'स्वीकृत' : 'APPROVED')}
                        </span>
                        <div className="text-[10px] text-emerald-400 font-mono font-bold">
                          PN: {b.private_number || 'BPL-PN-4412'}
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="space-y-1">
                        <span className="inline-block bg-slate-800 border border-slate-600 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                          {lang === 'hi' ? 'पूरा हुआ' : 'COMPLETED'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {lang === 'hi' ? 'ट्रैक साफ' : 'Track Clear'}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Role-Sensitive Action Column */}
                  <td className="py-3 px-3 text-right">
                    {isApprover ? (
                      <div className="flex justify-end">
                        {isConflict && (
                          <button
                            onClick={() => onExecuteShadowMerge && onExecuteShadowMerge("CONF-0901-0902")}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded shadow transition cursor-pointer flex items-center space-x-1"
                            title="Execute 1-Click AI Shadow Bundling"
                          >
                            <span>⚡</span>
                            <span>{lang === 'hi' ? 'AI शैडो मर्ज' : 'AI Shadow Merge'}</span>
                          </button>
                        )}
                        {isPending && (
                          <button
                            onClick={() => onSanctionBlock && onSanctionBlock(b.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition shadow cursor-pointer"
                          >
                            {lang === 'hi' ? 'प्राइवेट नंबर जारी करें और स्वीकृत करें' : 'Issue Private No. & Sanction'}
                          </button>
                        )}
                        {isApproved && (
                          <span className="text-slate-400 text-xs font-mono">
                            {lang === 'hi' ? 'परमिट सक्रिय ✓' : 'Permit Active ✓'}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-emerald-500 text-xs font-mono font-bold">
                            {lang === 'hi' ? 'ब्लॉक बंद कर दिया गया ✓' : 'Block Closed ✓'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        {isConflict && (
                          <span className="text-amber-400 text-[11px] font-mono">
                            {lang === 'hi' ? 'टकराव समीक्षा में' : 'In Conflict Review'}
                          </span>
                        )}
                        {isPending && (
                          <span className="text-slate-400 text-[11px] font-mono">
                            {lang === 'hi' ? 'वरिष्ठ DOM clearance की प्रतीक्षा है' : 'Awaiting Sr. DOM Clearance'}
                          </span>
                        )}
                        
                        {/* DEPT MARK DONE BUTTON WITH SPINNER */}
                        {isApproved && (
                          user?.portalType === 'DEPT' ? (
                            <button
                              onClick={() => onMarkComplete && onMarkComplete(b.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 rounded transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? (
                                <svg className="animate-spin h-3 w-3 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              )}
                              
                              {isProcessing 
                                ? (lang === 'hi' ? 'प्रसंस्करण...' : 'Processing...') 
                                : (lang === 'hi' ? 'कार्य पूर्ण करें' : 'Mark Work Done')}
                            </button>
                          ) : (
                            <span className="text-emerald-400 text-[11px] font-mono font-bold">
                              {lang === 'hi' ? 'स्वीकृति प्रदान की गई ✓' : 'Sanction Granted ✓'}
                            </span>
                          )
                        )}
                        
                        {isCompleted && (
                          <span className="text-slate-500 text-[11px] font-mono font-bold">
                            {lang === 'hi' ? 'कार्य समाप्त ✓' : 'Work Finished ✓'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}