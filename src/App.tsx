import { useState } from 'react';
import './App.css';
import DeckSelection from './components/DeckSelection';
import GameBoard from './components/GameBoard';

function App() {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  return (
    <div className="app">
      {!selectedArchetype ? (
        <DeckSelection onSelect={setSelectedArchetype} />
      ) : (
        <GameBoard archetype={selectedArchetype} onReturn={() => setSelectedArchetype(null)} />
      )}
    </div>
  );
}

export default App;
