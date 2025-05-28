import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import HomeV1 from "./pages/HomeV1";
import Claim from "./pages/Claim";


const App = () => {
  return (

    
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeV1 />} />
        <Route path="/withdraw" element={<Claim />} />
        
      </Routes>

     
    </BrowserRouter>
  );
};

export default App;
