import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./fsn-styles.css"; // Import modern FSN styles
import "./styles/mobile-fixes.css"; // Import mobile Safari fixes
import "./styles/safari-specific.css"; // Import Safari-specific overrides
import "./styles/admin-dashboard.css"; // Import admin dashboard styles
import "./styles/admin-login.css"; // Import admin login styles
import "./styles/navigation.css"; // Import navigation styles
import "./styles/claim-success.css"; // Import claim success animation styles

createRoot(document.getElementById("root")!).render(<App />);
