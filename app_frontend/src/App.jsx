import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EditProfilePage from './pages/EditProfilePage';
import MyPostsPage from './pages/MyPostsPage';
import MyFollowingPage from './pages/MyFollowingPage';
import MyFansPage from './pages/MyFansPage';
import MyDraftsPage from './pages/MyDraftsPage';
import MyLikesPage from './pages/MyLikesPage';
import MyBookmarksPage from './pages/MyBookmarksPage';
import UserProfilePage from './pages/UserProfilePage';
import ChatPage from './pages/ChatPage';
import ChatInfoPage from './pages/ChatInfoPage';
import ChatSearchPage from './pages/ChatSearchPage';
import MessageNotificationsPage from './pages/MessageNotificationsPage';
import PostDetailPage from './pages/PostDetailPage';
import AboutPage from './pages/AboutPage';
import GuidePage from './pages/GuidePage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/my-posts" element={<MyPostsPage />} />
          <Route path="/my-following" element={<MyFollowingPage />} />
          <Route path="/my-fans" element={<MyFansPage />} />
          <Route path="/my-drafts" element={<MyDraftsPage />} />
          <Route path="/my-likes" element={<MyLikesPage />} />
          <Route path="/my-bookmarks" element={<MyBookmarksPage />} />
          <Route path="/user/:id" element={<UserProfilePage />} />
<Route path="/post/:id" element={<PostDetailPage />} />
<Route path="/messages/notifications" element={<MessageNotificationsPage />} />
          <Route path="/messages/:id/info" element={<ChatInfoPage />} />
          <Route path="/messages/:id/search" element={<ChatSearchPage />} />
          <Route path="/messages/:id" element={<ChatPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
