import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { StackHandler, StackProvider, StackTheme } from "@stackframe/react";
import { stackApp } from "./lib/stack";
import AppLayout from "./layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import PDFViewerPage from "./pages/PdfViewerPage";

function HandlerRoutes() {
  const location = useLocation();
  return <StackHandler location={location.pathname} fullPage />;
}

function App() {
  return (
    <BrowserRouter>
      <StackProvider app={stackApp}>
        <StackTheme>
          <Routes>
            <Route path="/handler/*" element={<HandlerRoutes />} />
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/home"
              element={
                <FluentProvider theme={webLightTheme}>
                  <AppLayout />
                </FluentProvider>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="/home/chat/:chatId" element={<PDFViewerPage />} />
            </Route>
            <Route
              path="/chat/:chatId"
              element={
                <FluentProvider theme={webLightTheme}>
                  <AppLayout />
                </FluentProvider>
              }
            >
              <Route index element={<PDFViewerPage />} />
            </Route>
          </Routes>
        </StackTheme>
      </StackProvider>
    </BrowserRouter>
  );
}

export default App;
