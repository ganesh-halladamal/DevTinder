import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Layout from '@components/Layout';
import ProtectedRoute from '@components/ProtectedRoute';
import Home from '@pages/Home';
import Login from '@pages/Login';
import Register from '@pages/Register';
import Profile from '@pages/Profile';
import EditProfile from '@pages/EditProfile';
import Matches from '@pages/Matches';
import Chat from '@pages/Chat';
import NotFound from '@pages/NotFound';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/chat/:matchId" element={<Chat />} />
        </Route>
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App; 