import { createContext, useContext, useState, useCallback } from 'react';

const PostStateContext = createContext(null);

export function PostStateProvider({ children }) {
  const [updatedPosts, setUpdatedPosts] = useState({});
  const [refreshTriggers, setRefreshTriggers] = useState({});

  const updatePostState = useCallback((postId, updates) => {
    setUpdatedPosts(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        ...updates,
        updatedAt: Date.now(),
      },
    }));
  }, []);

  const clearPostState = useCallback((postId) => {
    setUpdatedPosts(prev => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  }, []);

  const triggerFeedRefresh = useCallback((endpoint) => {
    setRefreshTriggers(prev => ({
      ...prev,
      [endpoint]: (prev[endpoint] || 0) + 1,
    }));
  }, []);

  const getPostUpdates = useCallback((postId) => {
    return updatedPosts[postId] || null;
  }, [updatedPosts]);

  const hasUpdates = useCallback(() => {
    return Object.keys(updatedPosts).length > 0;
  }, [updatedPosts]);

  const value = {
    updatePostState,
    clearPostState,
    triggerFeedRefresh,
    getPostUpdates,
    hasUpdates,
    updatedPosts,
    refreshTriggers,
  };

  return (
    <PostStateContext.Provider value={value}>
      {children}
    </PostStateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePostState() {
  const context = useContext(PostStateContext);
  if (!context) {
    throw new Error('usePostState must be used within a PostStateProvider');
  }
  return context;
}

export default PostStateContext;
