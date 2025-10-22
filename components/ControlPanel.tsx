import React from 'react';
import { RiskLevel, RowCount, Mode } from '../types';
import { ROW_OPTIONS } from '../constants';

interface ControlPanelProps {
    betAmount: number;
    setBetAmount: (value: number) => void;
    risk: RiskLevel;
    setRisk: (value: RiskLevel) => void;
    rows: RowCount;
    setRows: (value: RowCount) => void;
    onManualDrop: () => void;
    onAutoDrop: () => void;
    isAutoBetting: boolean;
    mode: Mode;
    setMode: (mode: Mode) => void;
    numberOfBets: number;
    setNumberOfBets: (value: number) => void;
}

const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    betAmount, setBetAmount, risk, setRisk, rows, setRows, onManualDrop, onAutoDrop, 
    isAutoBetting, mode, setMode, numberOfBets, setNumberOfBets 
}) => {
    
    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0) {
            setBetAmount(value);
        } else if (e.target.value === '') {
            setBetAmount(0);
        }
    };

    const handleNumberOfBetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setNumberOfBets(value);
        } else if (e.target.value === '') {
            setNumberOfBets(0);
        }
    };
    
    return (
        <div className="w-[300px] bg-slate-700/50 p-4 flex-shrink-0 flex flex-col justify-between rounded-bl-xl">
            <div>
                <div className="bg-slate-900 rounded-lg p-1 flex mb-4">
                    <button onClick={() => setMode('Manual')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${mode === 'Manual' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Manual</button>
                    <button onClick={() => setMode('Auto')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${mode === 'Auto' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Auto</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Bet Amount</label>
                        <div className="flex items-center bg-slate-900 rounded-md">
                            <span className="text-slate-400 pl-3">$</span>
                            <input 
                                type="number" 
                                value={betAmount} 
                                onChange={handleBetChange}
                                className="w-full bg-transparent p-2 text-white font-semibold focus:outline-none" 
                                disabled={isAutoBetting}
                            />
                            <div className="flex items-center border-l border-slate-600">
                                <button onClick={() => setBetAmount(betAmount / 2)} className="px-3 py-2 text-slate-400 hover:text-white disabled:text-slate-600" disabled={isAutoBetting}>½</button>
                                <button onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 text-slate-400 hover:text-white border-l border-slate-600 disabled:text-slate-600" disabled={isAutoBetting}>2×</button>
                            </div>
                        </div>
                    </div>

                    {mode === 'Auto' && (
                        <div>
                           <label className="text-xs font-semibold text-slate-400 mb-1 block">Number of Bets</label>
                           <div className="flex items-center bg-slate-900 rounded-md">
                                <input
                                    type="number"
                                    value={numberOfBets}
                                    onChange={handleNumberOfBetsChange}
                                    className="w-full bg-transparent p-2 text-white font-semibold focus:outline-none"
                                    disabled={isAutoBetting}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Risk</label>
                        <select value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel)} className="w-full bg-slate-900 p-2 rounded-md text-white font-semibold focus:outline-none border border-transparent focus:border-slate-600 appearance-none" disabled={isAutoBetting}>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Rows</label>
                        <select value={rows} onChange={(e) => setRows(Number(e.target.value) as RowCount)} className="w-full bg-slate-900 p-2 rounded-md text-white font-semibold focus:outline-none border border-transparent focus:border-slate-600 appearance-none" disabled={isAutoBetting}>
                            {ROW_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                 <button 
                    onClick={mode === 'Manual' ? onManualDrop : onAutoDrop}
                    disabled={betAmount <= 0 && !isAutoBetting}
                    className={`mt-6 w-full text-white font-bold py-3 rounded-md text-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed ${isAutoBetting ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                    {isAutoBetting ? 'Stop Auto Bet' : (mode === 'Manual' ? 'Drop Ball' : 'Start Auto Bet')}
                </button>
            </div>

            <div className="flex items-center justify-center space-x-4 text-slate-400">
                <button className="hover:text-white"><CogIcon /></button>
                <button className="hover:text-white"><ChartBarIcon /></button>
            </div>
        </div>
    );
};
