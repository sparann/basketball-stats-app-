import { useState } from 'react';

const Captcha = ({ onSuccess }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'error' or 'success'
  const [isBanned, setIsBanned] = useState(false);

  // Randomize order only once on mount
  const [players] = useState(() =>
    [
      { id: 'wyatt', name: 'Wyatt', image: '/captcha/wyatt.png' },
      { id: 'player1', name: 'Player 1', image: '/captcha/player1.png' },
      { id: 'player2', name: 'Player 2', image: '/captcha/player2.png' },
      { id: 'player3', name: 'Player 3', image: '/captcha/player3.png' }
    ].sort(() => Math.random() - 0.5)
  );

  const handleConfirm = () => {
    if (!selectedPlayer) {
      setMessage('Please select a player');
      setMessageType('error');
      return;
    }

    if (selectedPlayer === 'wyatt') {
      setMessage("That's right");
      setMessageType('success');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts === 1) {
        setMessage('Think again');
        setMessageType('error');
      } else if (newAttempts === 2) {
        setMessage("C'mon now...");
        setMessageType('error');
      } else if (newAttempts === 3) {
        setMessage("You're banned from this URL. Redirecting...");
        setMessageType('error');
        setIsBanned(true);
        setTimeout(() => {
          setMessage('Just kidding, try again');
          setMessageType('error');
          setIsBanned(false);
        }, 3000);
      } else {
        setMessage('Try again');
        setMessageType('error');
      }
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-4 sm:p-8 my-4 transition-all ${isBanned ? 'opacity-50' : 'opacity-100'}`}>
        <h2 className={`text-lg sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 text-center ${isBanned ? 'text-slate-400' : ''}`}>
          To gain access to this app, please answer the following question correctly
        </h2>

        <p className={`text-base sm:text-2xl font-semibold text-slate-700 mb-4 sm:mb-6 text-center ${isBanned ? 'text-slate-400' : ''}`}>
          Select the best basketball player
        </p>

        <div className={`grid grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6 ${isBanned ? 'pointer-events-none' : ''}`}>
          {players.map((player) => (
            <div
              key={player.id}
              onClick={() => !isBanned && setSelectedPlayer(player.id)}
              className={`cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden border-3 sm:border-4 transition-all ${
                selectedPlayer === player.id
                  ? 'border-blue-600 shadow-xl scale-105'
                  : 'border-slate-200 hover:border-slate-300'
              } ${isBanned ? 'grayscale' : ''}`}
            >
              <img
                src={player.image}
                alt={player.name}
                className="w-full h-32 sm:h-64 object-cover"
              />
            </div>
          ))}
        </div>

        {message && (
          <div
            className={`text-center text-base sm:text-xl font-bold mb-3 sm:mb-4 ${
              messageType === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-base sm:text-lg hover:shadow-lg transition-all disabled:opacity-50"
          disabled={messageType === 'success' || isBanned}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default Captcha;
