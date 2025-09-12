import { Route, Routes } from "react-router-dom";
import "./App.css";
import Ide from "./pages/Ide";
import Dashboard from "./pages/Dashboard";

function App() {
  return <>
  <Routes>
    <Route path="/" element={<Dashboard/>} />
    <Route path="/:id" element={<Ide />} />
  </Routes>
  </>;
}

export default App;
