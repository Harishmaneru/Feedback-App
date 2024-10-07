 
import React from 'react';

import { BrowserRouter, Routes, Route , Navigate} from 'react-router-dom';
import VideoFeedbackForm from './VideoFeedbackForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/feedback" element={<VideoFeedbackForm />} />
        {/* <Route exact path="/VqaForm" element={<VqaForm />} /> */}
        <Route path="*" element={<Navigate to="/feedback" />} />
        <Route path="/" element={<Navigate to="/feedback" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


