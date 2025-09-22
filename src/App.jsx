import React, { useState } from 'react';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Dashboard from '../Dashboard';
import GlobalRanking from '../GlobalRanking';
import ContinentalRanking from '../ContinentalRanking';
import LeagueRanking from '../LeagueRanking';
import PlayerProfile from '../PlayerProfile';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'global':
        return <GlobalRanking />;
      case 'continental':
        return <ContinentalRanking />;
      case 'league':
        return <LeagueRanking />;
      case 'player':
        return <PlayerProfile player={selectedPlayer} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
        />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;