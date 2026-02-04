import { useState } from 'react';

interface LoginScreenProps {
  onCreateRoom: (roomName: string, username: string) => void;
  onJoinRoom: (roomId: string, username: string) => void;
}

export default function LoginScreen({
  onCreateRoom,
  onJoinRoom,
}: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomName.trim()) {
      onCreateRoom(roomName, username);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      onJoinRoom(roomId.toUpperCase(), username);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎨 Drawing Board
          </h1>
          <p className="text-gray-600">Collaborative drawing in real-time</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              mode === 'create'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              mode === 'join'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Username Input (common for both) */}
        <input
          type="text"
          placeholder="Enter your name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-4"
          autoFocus
        />

        {mode === 'create' ? (
          <form onSubmit={handleCreateRoom}>
            <input
              type="text"
              placeholder="Room name..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-4"
            />
            <button
              type="submit"
              className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition duration-200"
            >
              Create Room 🚀
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              placeholder="Room code (e.g., ABC123)..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-4"
              maxLength={6}
            />
            <button
              type="submit"
              className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition duration-200"
            >
              Join Room 🎯
            </button>
          </form>
        )}
      </div>
    </div>
  );
}