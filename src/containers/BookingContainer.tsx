/**
 * @page BookingContainer
 * @description Container para fluxos de reserva e agendamento.
 * @path src/containers/BookingContainer.tsx
 */



import { Card } from "../components/atomic/Card";

export const BookingContainer = () => {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Agendamentos</h2>
      <Card>Container para integrar UI + hooks de agendamento</Card>
    </section>
  );
};

export default BookingContainer;


