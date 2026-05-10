import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Tarefas } from "./pages/Tarefas";
import { CRM } from "./pages/CRM";
import { PipelineTheWay } from "./pages/PipelineTheWay";
import { Vendas } from "./pages/Vendas";
import { Conteudo } from "./pages/Conteudo";
import { Agenda } from "./pages/Agenda";
import { Documentos } from "./pages/Documentos";
import { Treinamentos } from "./pages/Treinamentos";
import { Senhas } from "./pages/Senhas";
import { Suporte } from "./pages/Suporte";
import { LinksUteis } from "./pages/LinksUteis";
import { PublicDocument } from "./pages/PublicDocument";
import { Perfil } from "./pages/Perfil";
import { Equipe } from "./pages/Equipe";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { Seeder } from "./components/Seeder";

function App() {
  return (
    <AuthProvider>
      <Seeder />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/publico/documento/:id" element={<PublicDocument />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="tarefas" element={<Tarefas />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="crm" element={<CRM />} />
              <Route path="pipeline" element={<PipelineTheWay />} />
              <Route path="vendas" element={<Vendas />} />
              <Route path="editorial" element={<Conteudo />} />
              <Route path="documentos" element={<Documentos />} />
              <Route path="treinamentos" element={<Treinamentos />} />
              <Route path="senhas" element={<Senhas />} />
              <Route path="suporte" element={<Suporte />} />
              <Route path="links" element={<LinksUteis />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="equipe" element={<Equipe />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
