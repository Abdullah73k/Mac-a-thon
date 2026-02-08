import { Router } from "@/router";
import { Toaster } from "sonner";

export function App() {
  return (
    <>
      <Router />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "bg-card text-card-foreground border-border text-xs",
        }}
      />
    </>
  );
}

export default App;
