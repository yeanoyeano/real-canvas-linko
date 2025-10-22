import React from 'react';
// @ts-ignore
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { Stats } from '../types';

interface LiveStatsProps {
    stats: Stats;
}

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 11M20 20l-1.5-1.5A9 9 0 003.5 13" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const LiveStats: React.FC<LiveStatsProps> = ({ stats }) => {
    // Determine the overall trend for chart color
    const isProfitable = stats.profit >= 0;
    const chartColor = isProfitable ? "#22c55e" : "#ef4444";
    const chartGradientId = isProfitable ? "colorProfit" : "colorLoss";

    return (
        <div className="w-[300px] bg-slate-900/50 p-4 flex-shrink-0 flex flex-col space-y-4 rounded-r-xl">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-300">Live Stats</h2>
                <div className="flex items-center space-x-3 text-slate-400">
                    <button className="hover:text-white"><RefreshIcon /></button>
                    <button className="hover:text-white"><XIcon /></button>
                </div>
            </div>

            <div className="bg-slate-800 p-3 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-xs text-slate-400">Profit</div>
                        <div className={`font-semibold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                            ${stats.profit.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Wins</div>
                        <div className="font-semibold text-slate-200">{stats.wins}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Losses</div>
                        <div className="font-semibold text-slate-200">{stats.losses}</div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-3 rounded-lg flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Profit History</h3>
                <div className="flex-1 w-full h-full min-h-[150px]">
                   {typeof ResponsiveContainer !== 'undefined' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.history} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                     <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1e293b', 
                                        border: '1px solid #334155',
                                        borderRadius: '0.5rem',
                                    }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    itemStyle={{ color: chartColor, fontWeight: 'bold' }}
                                    formatter={(value: number) => `$${value.toFixed(2)}`}
                                />
                                <YAxis 
                                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                    stroke="#475569" 
                                    domain={['auto', 'auto']}
                                    tickFormatter={(value) => `$${value}`}
                                    width={60}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="profit" 
                                    strokeWidth={2}
                                    stroke={chartColor}
                                    fillOpacity={1} 
                                    fill={`url(#${chartGradientId})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
