import { Link } from "react-router-dom";

export default function PreviewIndex() {
  const previews = [
    { label: "Login (preview)", path: "/preview/login" },
    { label: "Register (preview)", path: "/preview/register" },
    { label: "Forgot Password (preview)", path: "/preview/forgot" },
    { label: "Operational (preview)", path: "/preview/operational" },
    { label: "Scheduling (preview)", path: "/preview/scheduling" },
    {
      label: "Appointment Confirmation (preview)",
      path: "/preview/appointment-confirmation",
    },
    { label: "Digital Ticket (preview)", path: "/preview/digital-ticket" },
    { label: "User Profiles (preview)", path: "/preview/user-profiles" },
    { label: "Results History (preview)", path: "/preview/results-history" },
  ];

  const quick = [
    { label: "Agendamentos (app)", path: "/app/agendamentos" },
    { label: "Confirmação (app)", path: "/app/agendamentos/confirmacao" },
    { label: "Ticket (app)", path: "/app/ticket" },
    { label: "Resultados (app)", path: "/app/resultados" },
    { label: "User Profiles (app)", path: "/app/user-profiles" },
  ];

  return (
    <div className="p-8 min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Preview Index</h1>

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Previews</h2>
          <ul className="space-y-2">
            {previews.map((p) => (
              <li key={p.path}>
                <Link to={p.path} className="text-primary hover:underline">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Quick App Routes</h2>
          <ul className="space-y-2">
            {quick.map((p) => (
              <li key={p.path}>
                <Link to={p.path} className="text-primary hover:underline">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
