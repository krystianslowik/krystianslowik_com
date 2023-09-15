import "./App.css";
import Contact from "./components/Contact";
import ReactGA from "react-ga";

function App() {
  ReactGA.initialize("G-JL2B1WGQ1Q");
  return <Contact />;
}

export default App;
