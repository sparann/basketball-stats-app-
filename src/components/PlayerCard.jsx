import {
  formatWinPercentage,
  getWinPercentageColor,
  formatDate
} from '../utils/calculations';

const PlayerCard = ({ player }) => {
  const winPercentageColor = getWinPercentageColor(player.overallWinPercentage);

  return (
    <div className="player-card">
      <div className="player-card-header">
        <h2 className="player-name">{player.name}</h2>
      </div>

      <div className={`win-percentage ${winPercentageColor}`}>
        {formatWinPercentage(player.overallWinPercentage)}
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-label">Total Games</span>
          <span className="stat-value">{player.totalGamesPlayed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Games Won</span>
          <span className="stat-value">{player.totalGamesWon}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Sessions</span>
          <span className="stat-value">{player.sessionsAttended}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last Played</span>
          <span className="stat-value">{formatDate(player.lastPlayed)}</span>
        </div>
      </div>

      <div className="session-trend">
        <h4>Recent Performance</h4>
        <div className="trend-bars">
          {player.sessions.slice(-5).map((session, index) => (
            <div
              key={index}
              className="trend-bar"
              title={`${formatDate(session.date)}: ${formatWinPercentage(session.winPercentage)}`}
            >
              <div
                className={`trend-bar-fill ${getWinPercentageColor(session.winPercentage)}`}
                style={{ height: `${session.winPercentage * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
