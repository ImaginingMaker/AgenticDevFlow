// 整洁的 React 组件代码（用于 refactor-advisor 测试）
// 符合最佳实践

import React, { useState, useCallback, useMemo } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  skills: string[];
}

interface UserDetails {
  name: string;
  email: string;
  bio?: string;
}

interface UserCardProps {
  user: User;
  onClick: (userId: string) => void;
}

const BUTTON_STYLE = {
  backgroundColor: '#fff',
  padding: '10px',
};

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    onClick(user.id);
  }, [onClick, user.id]);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data: UserDetails = await response.json();
      setUserDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const skillElements = useMemo(
    () => user.skills.map((skill) => (
      <span key={skill} className="skill-tag">{skill}</span>
    )),
    [user.skills]
  );

  if (isLoading) {
    return <div className="user-card loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="user-card error">
        <p>Error: {error}</p>
        <button onClick={fetchUserData}>Retry</button>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return (
    <div className="user-card" onClick={handleClick}>
      {user.avatar && (
        <img
          src={user.avatar}
          alt={userDetails.name}
          className="user-avatar"
        />
      )}

      <div className="skill-list">
        {skillElements}
      </div>

      <h3>{userDetails.name}</h3>
      <p>{userDetails.email}</p>
      {userDetails.bio && <p className="bio">{userDetails.bio}</p>}

      <button style={BUTTON_STYLE} aria-label="Edit user">
        Edit
      </button>
    </div>
  );
};