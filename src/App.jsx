import { HashRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import HomeV1 from "./pages/HomeV1";

const App = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeV1 />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
