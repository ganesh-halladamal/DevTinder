import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
}

interface Match {
  id: string;
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  lastMessage?: Message;
  matchScore: number;
  matchedAt: string;
  status: 'active' | 'archived' | 'blocked';
}

interface ChatListProps {
  matches: Match[];
  currentUserId: string;
  onArchiveMatch: (matchId: string) => void;
  onBlockMatch: (matchId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  matches,
  currentUserId,
  onArchiveMatch,
  onBlockMatch
}) => {
  const getOtherUser = (match: Match) => {
    return match.users.find(user => user.id !== currentUserId);
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-card-foreground">No Matches Yet</h3>
        <p className="text-muted-foreground mt-2">
          Start swiping to find your next coding partner!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map(match => {
        const otherUser = getOtherUser(match);
        if (!otherUser) return null;

        return (
          <div
            key={match.id}
            className="bg-card rounded-lg p-4 hover:bg-accent/10 transition-colors"
          >
            <Link to={`/chat/${match.id}`} className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="relative">
                {otherUser.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-lg font-medium text-accent-foreground">
                      {otherUser.name[0]}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-card-foreground truncate">
                    {otherUser.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(match.matchedAt), { addSuffix: true })}
                  </span>
                </div>

                {match.lastMessage ? (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {match.lastMessage.sender.id === currentUserId ? 'You: ' : ''}
                    {match.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Start a conversation!
                  </p>
                )}

                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-primary">
                    {match.matchScore}% Match
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onArchiveMatch(match.id);
                    }}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Archive
                  </button>
                  <span className="text-xs text-muted-foreground">•</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onBlockMatch(match.id);
                    }}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Block
                  </button>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList; 