import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('/game', {
  transports: ['websocket'], // Force websocket
  autoConnect: false
});

const VoteDiagram = ({ players, votes, liarId }) => {
  const radius = 100; // Radius of the circle
  const center = 150; // Center coordinates (150, 150)

  if (!players || players.length === 0) return null;

  // Calculate positions
  const playerPositions = players.map((p, i) => {
    const angle = (i * 2 * Math.PI) / players.length - Math.PI / 2; // Start from top (-90deg)
    return {
      id: p.id,
      name: p.name,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      isLiar: p.id === liarId
    };
  });

  return (
    <div className="vote-diagram-container">
      <svg width="300" height="300" viewBox="0 0 300 300">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7"
            refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#D97757" opacity="0.8" />
          </marker>
        </defs>

        {/* Arrows */}
        {players.map(p => {
          const targetId = votes[p.id];
          if (!targetId) return null;
          const start = playerPositions.find(pos => pos.id === p.id);
          const end = playerPositions.find(pos => pos.id === targetId);
          if (!start || !end) return null;

          return (
            <line
              key={p.id}
              x1={start.x} y1={start.y}
              x2={end.x} y2={end.y}
              stroke="#D97757"
              strokeWidth="1.5"
              strokeOpacity="0.6"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Players */}
        {playerPositions.map(pos => (
          <g key={pos.id} transform={`translate(${pos.x}, ${pos.y})`}>
            <circle
              r="18"
              fill={pos.isLiar ? "#ef4444" : "#f3f4f6"}
              stroke={pos.isLiar ? "#b91c1c" : "#d1d5db"}
              strokeWidth="2"
            />
            <text
              y="5"
              textAnchor="middle"
              fontSize="12"
              fill={pos.isLiar ? "white" : "#374151"}
              fontWeight="bold"
              dy="1"
            >
              {pos.name.slice(0, 2)}
            </text>
            <text
              y="32"
              textAnchor="middle"
              fontSize="11"
              fill="#666"
            >
              {pos.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [name, setName] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [myId, setMyId] = useState('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [modelName, setModelName] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      setMyId(socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('roomUpdate', (room) => {
      setRoomState(room);
    });

    socket.on('serverInfo', (info) => {
      setModelName(info.model);
    });

    socket.on('loadingTopics', (isLoading) => {
      setIsLoadingTopics(isLoading);
    });

    socket.on('error', (msg) => {
      alert(msg);
      setErrorMsg(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomUpdate');
      socket.off('loadingTopics');
      socket.off('error');
    };
  }, []);

  const handleJoin = () => {
    if (!name.trim()) return alert('이름을 입력해주세요.');
    socket.connect();
    socket.emit('join', { name });
  };

  const handleSuggestTopic = () => {
    socket.emit('suggestTopic', { room: 'travel' }); // Default room
  };

  const handleSelectTopic = (topic) => {
    socket.emit('selectTopic', { room: 'travel', topic });
  };

  const handleStartGame = () => {
    socket.emit('startGame', { room: 'travel' });
  };

  const handleStartVote = () => {
    socket.emit('startVote', { room: 'travel' });
  };

  const handleVote = (targetId) => {
    socket.emit('vote', { room: 'travel', targetId });
  };

  const handleReset = () => {
    socket.emit('reset', { room: 'travel' });
  }

  const handleAddTopic = () => {
    if (!customTopic.trim()) return;
    socket.emit('addTopic', { room: 'travel', topic: customTopic });
    setCustomTopic('');
  };

  // Renders
  const renderContent = () => {
    if (!isConnected || !roomState) {
      return (
        <div className="container join-screen slide-up" key="join">
          <h1>라이어 게임</h1>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <button onClick={handleJoin} className="primary-btn">접속하기</button>
        </div>
      );
    }

    const { players, topics, status, currentTopic, selectedTopic, civilianWord, liarWord, votes, winner, votedOutId, liarId } = roomState;
    const me = players.find(p => p.id === myId) || {};
    const isHost = me.isHost;

    if (status === 'waiting') {
      return (
        <div className="container lobby-screen slide-up" key="waiting">
          <h2>대기방 ({players.length}명)</h2>
          <div className="player-list">
            {players.map(p => (
              <div key={p.id} className="player-card">
                {p.isHost && <span className="host-badge">HOST</span>} {p.name} {p.id === myId && '(나)'}
              </div>
            ))}
          </div>

          <div className="topics-section">
            <h3>주제 선택</h3>
            {selectedTopic && <p className="selected-feedback">선택됨: <strong>{selectedTopic}</strong></p>}
            <div className="topics-list">
              {topics.length === 0 ? <p className="empty-text">주제를 뽑아보세요!</p> :
                topics.map((t, i) => (
                  <button
                    key={i}
                    className={`topic-tag ${selectedTopic === t ? 'selected' : ''}`}
                    onClick={() => handleSelectTopic(t)}
                  >
                    {t}
                  </button>
                ))
              }
            </div>

            <div className="custom-topic-area">
              <input
                type="text"
                className="custom-topic-input"
                placeholder="주제 직접 입력"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
              />
              <button onClick={handleAddTopic} className="custom-topic-btn">추가</button>
            </div>

            <button
              onClick={handleSuggestTopic}
              disabled={isLoadingTopics}
              className={`secondary-btn ai-topic-btn ${isLoadingTopics ? 'loading' : ''}`}
            >
              {isLoadingTopics ? (
                <>
                  <span className="mini-loader"></span>
                  <span className="typing-text">AI가 주제 구상 중...</span>
                </>
              ) : (
                <>
                  주제 생성하기
                </>
              )}
            </button>
          </div>

          <div className="action-area">
            {/* Anyone can start for convenience, or restrict to host */}
            <button onClick={handleStartGame} className="primary-btn start-btn">
              게임 시작!
            </button>
          </div>
        </div>
      );
    }

    if (status === 'loading') {
      return (
        <div className="container loading-screen slide-up" key="loading">
          <div className="ai-loader-container">
            <div className="ai-loader"></div>
            <div className="ai-loader-blur"></div>
          </div>
          <h2 className="ai-text">게임을 생성 중입니다</h2>
          <p className="ai-subtext">주제에 맞는 제시어를 고르고 있습니다</p>
        </div>
      )
    }

    if (status === 'playing') {
      return (
        <div className="container game-screen slide-up" key="playing">
          <div className="role-card neutral-card">
            <div className="card-header">
              <span className="badge">SECRET</span>
              <p className="topic-hint">주제: {currentTopic}</p>
            </div>

            <div className="word-reveal">
              <p className="label">당신의 제시어</p>
              <h1 className="my-word">{me.word}</h1>
            </div>

            <div className="game-guide">
              <p>
                자신의 단어를 설명하되, <br />
                <strong>너무 구체적이지 않게</strong> 이야기하세요.
              </p>
              <p className="sub-guide">
                다른 사람의 단어와 내 단어가 미묘하게 다를 수 있습니다.<br />
                누가 거짓말(다른 단어)을 하고 있는지 찾아보세요!
              </p>
            </div>
          </div>

          <div className="game-status">
            <p>대화를 나누고 라이어를 찾아내세요.</p>
          </div>

          <button onClick={handleStartVote} className="primary-btn vote-btn">투표 시작</button>
        </div>
      );
    }

    if (status === 'voting') {
      const hasVoted = votes[myId]; // Used for UI feedback, not for disabling
      return (
        <div className="container voting-screen slide-up" key="voting">
          <h2>라이어를 지목하세요</h2>
          <div className="player-grid">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => handleVote(p.id)}
                disabled={p.id === myId} // Allow changing vote, only disable self-vote
                className={`vote-card ${votes[p.id] ? 'voted-target' : ''} ${votes[myId] === p.id ? 'my-vote' : ''}`}
              >
                <div className="avatar">{p.name[0]}</div>
                <div className="name">{p.name}</div>
                {/* Show who voted status? Not who they voted for, but IF they voted. */}
                {Object.keys(votes).includes(p.id) && <span className="voted-badge">투표완료</span>}
              </button>
            ))}
          </div>
          <p className="status-text">{Object.keys(votes).length} / {players.length} 명 투표 완료</p>
        </div>
      )
    }

    if (status === 'result') {
      const votedPlayer = players.find(p => p.id === votedOutId);
      return (
        <div className="container result-screen slide-up" key="result">
          <h1 className={winner === 'civilian' ? 'win-text' : 'lose-text'}>
            {winner === 'civilian' ? '시민 승리' : '라이어 승리'}
          </h1>

          <VoteDiagram players={players} votes={votes} liarId={liarId} />

          <div className="result-detail">
            <p><strong>주제:</strong> {currentTopic}</p>
            <p>지목된 사람: <strong>{votedPlayer?.name}</strong> ({votedPlayer?.role})</p>
            <p>진짜 라이어: <strong>{players.find(p => p.role === 'liar')?.name}</strong></p>
            <hr />
            <p>시민 단어: <strong>{civilianWord}</strong></p>
            <p>라이어 단어: <strong>{liarWord}</strong></p>
          </div>

          <button onClick={handleReset} className="primary-btn">대기방으로</button>
        </div>
      )
    }

    return <div className="loading-fallback">Loading...</div>;
  };

  return (
    <>
      {renderContent()}
    </>
  );
}

export default App;