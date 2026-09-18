import React, { useState } from 'react';

export default function BlockRequestForm({ currentUser, onSubmitSuccess, onCancel }) {
  const dept = currentUser.initials || 'TMS'; // TMS, TDMS, or SMMS

  // Common Fields
  const [section, setSection] = useState('BPL - ET (Bhopal – Itarsi)');
  const [track, setTrack] = useState('DN Main');
  
  // FIXED LOCAL DATE: Uses local timezone representation (YYYY-MM-DD)
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDateString());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');

  // TMS (Civil / P-Way) Specifics
  const [tmsMachine, setTmsMachine] = useState('CSM (09-32 Continuous Tamping)');
  const [kmFrom, setKmFrom] = useState('824/12');
  const [kmTo, setKmTo] = useState('828/04');
  const [tmsWorkType, setTmsWorkType] = useState('Deep Screening & Track Tamping');
  const [tsrSpeed, setTsrSpeed] = useState('30 km/h');

  // TDMS (TRD / 25kV OHE) Specifics
  const [tdmsBlockType, setTdmsBlockType] = useState('Pre-arranged Power Block');
  const [elemSection, setElemSection] = useState('ES-HBJ-2104 to ES-MDDP-2110');
  const [towerWagon, setTowerWagon] = useState('8-Wheeler High-Reach Tower Car');
  const [ladderGangs, setLadderGangs] = useState('2 Gangs (14 Men)');
  const [earthingRods, setEarthingRods] = useState('4 Pairs Discharge Rods');

  // SMMS (Signal & Telecom) Specifics
  const [stFormNo, setStFormNo] = useState('S&T-T/351-BPL-402');
  const [stGear, setStGear] = useState('Point Machine 104B & Axle Counter Reset');
  const [interlockingType, setInterlockingType] = useState('Electronic Interlocking (EI)');
  const [standbyProvision, setStandbyProvision] = useState('Manual Crank Handle Locked');

  const calculateHours = () => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const durationHours = calculateHours();

    const newRequest = {
      id: `REQ-${dept}-${Math.floor(1000 + Math.random() * 9000)}`,
      department: currentUser.role,
      section: section,
      track: track,
      work_type: dept === 'TMS' ? tmsWorkType : dept === 'TDMS' ? tdmsBlockType : stGear,
      start_time: `${date}T${startTime}:00`,
      end_time: `${date}T${endTime}:00`,
      duration_hours: durationHours,
      assigned_machine: dept === 'TMS' ? tmsMachine : dept === 'TDMS' ? towerWagon : 'S&T Test Kit',
      speed_restriction: dept === 'TMS' ? tsrSpeed : 'Caution 45 km/h',
      ohe_power_cut: dept === 'TDMS' ? 'YES' : 'NO',
      disruption_score: durationHours > 3 ? 'High' : 'Moderate',
      meta: {
        kmRange: dept === 'TMS' ? `${kmFrom} – ${kmTo}` : null,
        elementarySection: dept === 'TDMS' ? elemSection : null,
        disconnectionNotice: dept === 'SMMS' ? stFormNo : null
      }
    };

    onSubmitSuccess(newRequest);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-md font-sans space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded text-white ${
              dept === 'TMS' ? 'bg-amber-600' : 'bg-blue-800'
            }`}>
              {dept} REQUISITION
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {dept === 'TMS' && 'Track Management System (P-Way Possession Demand)'}
              {dept === 'TDMS' && 'Traction Distribution (25kV OHE Power Block Demand)'}
              {dept === 'SMMS' && 'Signal Maintenance (Disconnection & Interlocking Demand)'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official corridor access lodgement under G&SR Rule 15.06 for Bhopal Division.
          </p>
        </div>

        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-slate-300 dark:border-slate-700">
          Estimated Block Window: <strong className="text-blue-600 dark:text-blue-400">{calculateHours()} Hrs</strong>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Common Corridor Location Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option>BPL - ET (Bhopal – Itarsi)</option>
              <option>BINA - BPL (Bina – Bhopal)</option>
              <option>HBJ - ET (Habibganj – Itarsi)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Track Line Affected</label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option>DN Main</option>
              <option>UP Main</option>
              <option>DN Loop 1</option>
              <option>Both UP & DN (Integrated)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Date of Block</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Row 2: Time Window */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Demanded Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Demanded End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* --- DYNAMIC SECTION: TMS (Civil Engineering) --- */}
        {dept === 'TMS' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              🚜 TMS Track Machine & P-Way Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Heavy Track Machine</label>
                <select
                  value={tmsMachine}
                  onChange={(e) => setTmsMachine(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option>CSM (09-32 Continuous Tamping)</option>
                  <option>BCM (Ballast Cleaning Machine)</option>
                  <option>DTS (Dynamic Track Stabilizer)</option>
                  <option>TRT (Track Relaying Train)</option>
                  <option>Manual P-Way Gang (No Machine)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Km From</label>
                <input
                  type="text"
                  value={kmFrom}
                  onChange={(e) => setKmFrom(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Km To</label>
                <input
                  type="text"
                  value={kmTo}
                  onChange={(e) => setKmTo(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Nature of Track Work</label>
                <select
                  value={tmsWorkType}
                  onChange={(e) => setTmsWorkType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option>Deep Screening & Track Tamping</option>
                  <option>Through Rail Renewal (TRR)</option>
                  <option>Weld In-situ Testing (USFD)</option>
                  <option>Turnout Replacement & Packing</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Post-Work TSR Imposed</label>
                <select
                  value={tsrSpeed}
                  onChange={(e) => setTsrSpeed(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option>20 km/h (Day 1 Caution)</option>
                  <option>30 km/h (Standard Tamping)</option>
                  <option>45 km/h (Stabilized with DTS)</option>
                  <option>Normal Section Speed (MPS)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* --- DYNAMIC SECTION: TDMS (TRD / 25kV OHE) --- */}
        {dept === 'TDMS' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              ⚡ TDMS Traction Distribution & 25kV Power Block Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Block Classification</label>
                <select
                  value={tdmsBlockType}
                  onChange={(e) => setTdmsBlockType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option>Pre-arranged Power Block</option>
                  <option>Emergency Line Cut</option>
                  <option>Local Isolation (Yard Lines)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Elementary Section(s) to Isolate</label>
                <input
                  type="text"
                  value={elemSection}
                  onChange={(e) => setElemSection(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Rolling Stock Machine</label>
                <select
                  value={towerWagon}
                  onChange={(e) => setTowerWagon(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option>8-Wheeler High-Reach Tower Car</option>
                  <option>4-Wheeler Inspection Car</option>
                  <option>Hand Ladder Gang Only</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Ground Ladder Gangs</label>
                <input
                  type="text"
                  value={ladderGangs}
                  onChange={(e) => setLadderGangs(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Earthing Rod Provision</label>
                <input
                  type="text"
                  value={earthingRods}
                  onChange={(e) => setEarthingRods(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- DYNAMIC SECTION: SMMS (Signal & Telecom) --- */}
        {dept === 'SMMS' && (
          <div className="bg-blue-800/10 border border-blue-800/30 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
              📡 SMMS Signal Interlocking & Disconnection Notice
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Statutory Form No. (S&T-T/351)</label>
                <input
                  type="text"
                  value={stFormNo}
                  onChange={(e) => setStFormNo(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Signaling Interlocking Installation</label>
                <select
                  value={interlockingType}
                  onChange={(e) => setInterlockingType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option>Electronic Interlocking (EI - Kyosan/Ansaldo)</option>
                  <option>Route Relay Interlocking (RRI)</option>
                  <option>Panel Interlocking (PI)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Gears Under Disconnection</label>
                <input
                  type="text"
                  value={stGear}
                  onChange={(e) => setStGear(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Fail-Safe Crank Provision</label>
                <input
                  type="text"
                  value={standbyProvision}
                  onChange={(e) => setStandbyProvision(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md transition cursor-pointer"
          >
            Lodge Requisition with Section Control →
          </button>
        </div>
      </form>
    </div>
  );
}