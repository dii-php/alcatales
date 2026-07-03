import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import OurStory from './pages/OurStory';
import Gallery from './pages/Gallery';
import Timeline from './pages/Timeline';
import LoveLetter from './pages/LoveLetter';
import LetterView from './pages/LetterView';
import WishWall from './pages/WishWall';
import WishView from './pages/WishView';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/our-story" element={<OurStory />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/love-letter" element={<LoveLetter />} />
              <Route path="/love-letter/:id" element={<LetterView />} />
              <Route path="/wish-wall" element={<WishWall />} />
              <Route path="/wish-wall/:id" element={<WishView />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
