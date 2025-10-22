import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { PlinkoBoard } from './components/PlinkoBoard';
import { LiveStats } from './components/LiveStats';
import { RiskLevel, RowCount, BallType, Stats, Mode } from './types';
// FIX: Import MULTIPLIERS constant to resolve reference error.
import { MULTIPLIERS } from './constants';

const BOARD_WIDTH = 600;

const PlinkoLogo = () => (
  <h1 className="text-3xl font-bold text-slate-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
    Plinko
  </h1>
);

const AddBalanceMenu = ({ onAdd, onBonus }: { onAdd: (amount: number) => void, onBonus: (amount: number) => void }) => (
    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg z-10 p-2">
        <div className="grid grid-cols-1 gap-2">
            {[100, 500, 1000, 5000].map(amount => (
                <button key={amount} onClick={() => onAdd(amount)} className="text-left px-3 py-2 text-sm text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
                    Add ${amount.toLocaleString()}
                </button>
            ))}
             <button onClick={() => onBonus(10000)} className="text-left px-3 py-2 text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-md transition-colors font-semibold">
                Bonus $10,000
            </button>
        </div>
    </div>
);


const BalanceDisplay = ({ balance, onAddClick }: { balance: number, onAddClick: () => void }) => (
  <div className="flex items-center space-x-2">
    <div className="bg-slate-900 p-2 rounded-md flex items-center">
      <span className="text-slate-400 text-sm mr-2">$</span>
      <span className="text-slate-200 font-semibold">{balance.toFixed(2)}</span>
    </div>
    <button onClick={onAddClick} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors">
      Add
    </button>
  </div>
);

export default function App() {
  const [balance, setBalance] = useState(179.00);
  const [betAmount, setBetAmount] = useState(1);
  const [risk, setRisk] = useState<RiskLevel>('Medium');
  const [rows, setRows] = useState<RowCount>(16);
  const [balls, setBalls] = useState<BallType[]>([]);
  const [stats, setStats] = useState<Stats>({
    profit: 0.00,
    wins: 0,
    losses: 0,
    history: [{ game: 0, profit: 0 }],
  });
  const [mode, setMode] = useState<Mode>('Manual');
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [numberOfBets, setNumberOfBets] = useState(10);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const addMenuRef = useRef<HTMLDivElement>(null);
  
  const autoBetCount = useRef(0);
  const autoBetInterval = useRef<number | null>(null);

  const handleDropBall = useCallback(() => {
    if (balance < betAmount) {
      if(isAutoBetting) {
        setIsAutoBetting(false);
      }
      alert("Insufficient balance!");
      return;
    }

    setBalance(prev => prev - betAmount);

    const newBall: BallType = {
        id: Date.now() + Math.random(),
        x: BOARD_WIDTH / 2,
        betAmount: betAmount,
        color: '#ef4444' // All balls are now red
    };
    
    setBalls(prev => [...prev, newBall]);

  }, [betAmount, balance, isAutoBetting]);

  const handleAnimationEnd = useCallback((ballId: number, bucketIndex: number, betAmountValue: number) => {
    const multipliers = MULTIPLIERS[risk][rows];
    const multiplier = multipliers[bucketIndex];
    const payout = betAmountValue * multiplier;
    
    setBalance(prevBalance => prevBalance + payout);

    setStats(prevStats => {
        const newProfit = prevStats.profit + (payout - betAmountValue);
        const newHistory = [...prevStats.history, { game: prevStats.history.length, profit: newProfit }];
        if (newHistory.length > 50) newHistory.shift();
        return {
            profit: newProfit,
            wins: payout >= betAmountValue ? prevStats.wins + 1 : prevStats.wins,
            losses: payout < betAmountValue ? prevStats.losses + 1 : prevStats.losses,
            history: newHistory,
        };
    });

    // Removed setTimeout to prevent race conditions and ensure balls are removed from state synchronously.
    setBalls(prev => prev.filter(b => b.id !== ballId));
  }, [risk, rows]);
  
  const dropBallAction = useCallback(() => {
    handleDropBall();
    if (mode === 'Auto' && isAutoBetting) {
        autoBetCount.current++;
        if (autoBetCount.current >= numberOfBets) {
            setIsAutoBetting(false);
        }
    }
  }, [handleDropBall, mode, isAutoBetting, numberOfBets]);

  useEffect(() => {
    if (isAutoBetting) {
        autoBetInterval.current = window.setInterval(dropBallAction, 500);
    } else if (autoBetInterval.current) {
        clearInterval(autoBetInterval.current);
        autoBetInterval.current = null;
    }

    return () => {
        if (autoBetInterval.current) {
            clearInterval(autoBetInterval.current);
        }
    };
  }, [isAutoBetting, dropBallAction]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
            setIsAddMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const startAutoBetting = () => {
    setIsAutoBetting(true);
    autoBetCount.current = 0;
    dropBallAction(); // Drop first ball immediately
  };

  const stopAutoBetting = () => {
    setIsAutoBetting(false);
  };
  
  const handleAddFunds = (amount: number) => {
    setBalance(prev => prev + amount);
    setIsAddMenuOpen(false);
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 text-slate-300">
      <div className="w-full max-w-[1400px] mx-auto">
        <header className="flex justify-between items-center p-4 bg-slate-800 rounded-t-xl border-b border-slate-700">
            <PlinkoLogo />
            <div className="relative" ref={addMenuRef}>
                <BalanceDisplay balance={balance} onAddClick={() => setIsAddMenuOpen(prev => !prev)} />
                {isAddMenuOpen && <AddBalanceMenu onAdd={handleAddFunds} onBonus={handleAddFunds} />}
            </div>
        </header>

        <main className="flex bg-slate-800 rounded-b-xl shadow-2xl min-h-[700px]">
          <ControlPanel 
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            risk={risk}
            setRisk={setRisk}
            rows={rows}
            setRows={setRows}
            onManualDrop={handleDropBall}
            onAutoDrop={isAutoBetting ? stopAutoBetting : startAutoBetting}
            isAutoBetting={isAutoBetting}
            mode={mode}
            setMode={setMode}
            numberOfBets={numberOfBets}
            setNumberOfBets={setNumberOfBets}
          />
          <PlinkoBoard 
            rows={rows}
            risk={risk}
            balls={balls}
            onAnimationEnd={handleAnimationEnd}
          />
          <LiveStats stats={stats} />
        </main>
      </div>
      <footer className="text-center text-slate-500 mt-4 text-sm">
        Anson Heung &copy; 2024 - Recreated by World-Class AI Engineer
      </footer>
    </div>
  );
}