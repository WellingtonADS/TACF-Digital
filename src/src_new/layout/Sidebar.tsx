import { Card } from "../components/atomic/Card";

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-50 h-screen p-4 border-r">
      <div className="mb-6 font-semibold">TACF</div>
      <nav className="space-y-2">
        <a className="block py-2 px-3 rounded hover:bg-gray-100">Dashboard</a>
        <a className="block py-2 px-3 rounded hover:bg-gray-100">
          Agendamentos
        </a>
        <a className="block py-2 px-3 rounded hover:bg-gray-100">Usuários</a>
      </nav>
      <div className="mt-6">
        <Card className="text-sm">Versão: esqueleto</Card>
      </div>
    </aside>
  );
};

export default Sidebar;
