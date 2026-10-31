import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import ServerHealthGate from "./components/ServerHealthGate.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <ServerHealthGate>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ServerHealthGate>
        </BrowserRouter>
    </StrictMode>
);

