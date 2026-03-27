import { Switch, Route } from "wouter";
import { BizLayout } from "./layout/BizLayout";
import Dzis from "./pages/Dzis";
import Repertuar from "./pages/Repertuar";
import Galeria from "./pages/Galeria";
import Grupy from "./pages/Grupy";
import Ogloszenia from "./pages/Ogloszenia";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Profil from "./pages/Profil";

export default function App() {
  return (
    <BizLayout>
      <Switch>
        <Route path="/" component={Dzis} />
        <Route path="/repertuar" component={Repertuar} />
        <Route path="/galeria" component={Galeria} />
        <Route path="/grupy" component={Grupy} />
        <Route path="/ogloszenia" component={Ogloszenia} />
        <Route path="/login" component={Login} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/profil" component={Profil} />
        <Route>
          <div style={{ padding: 40, textAlign: "center", color: "#787878" }}>404 – Nie znaleziono</div>
        </Route>
      </Switch>
    </BizLayout>
  );
}
