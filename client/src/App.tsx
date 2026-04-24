import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import { BizLayout } from "./layout/BizLayout";
import Dzis from "./pages/Dzis";
import Repertuar from "./pages/Repertuar";
import Galeria from "./pages/Galeria";
import Grupy from "./pages/Grupy";
import Ogloszenia from "./pages/Ogloszenia";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Profil from "./pages/Profil";
import Wiadomosci from "./pages/Wiadomosci";
import Info from "./pages/Info";
import Admin from "./pages/Admin";

const initialHash = window.location.hash;

function AuthHandler() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (initialHash.includes("type=recovery")) {
      setLocation("/reset-password");
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        const meta = session?.user?.user_metadata || {};
        const profileIncomplete = !meta.display_name && !meta.full_name && !meta.name;
        if (profileIncomplete) {
          // Nowy użytkownik lub ktoś bez uzupełnionego profilu — kieruj na profil
          setLocation("/profil");
        }
        subscription.unsubscribe();
      }
    });
    return () => subscription.unsubscribe();
  }, [setLocation]);
  return null;
}

export default function App() {
  return (
    <BizLayout>
      <AuthHandler />
      <Switch>
        <Route path="/" component={Dzis} />
        <Route path="/repertuar" component={Repertuar} />
        <Route path="/galeria" component={Galeria} />
        <Route path="/grupy" component={Grupy} />
        <Route path="/ogloszenia" component={Ogloszenia} />
        <Route path="/login" component={Login} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/profil" component={Profil} />
        <Route path="/wiadomosci" component={Wiadomosci} />
        <Route path="/info" component={Info} />
        <Route path="/admin" component={Admin} />
        <Route>
          <div style={{ padding: 40, textAlign: "center", color: "#787878" }}>404 – Nie znaleziono</div>
        </Route>
      </Switch>
    </BizLayout>
  );
}
