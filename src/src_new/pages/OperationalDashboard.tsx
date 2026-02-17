import BookingContainer from "../containers/BookingContainer";
import Layout from "../layout/Layout";

export const OperationalDashboard = () => {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Painel Operacional</h1>
      <BookingContainer />
    </Layout>
  );
};

export default OperationalDashboard;
