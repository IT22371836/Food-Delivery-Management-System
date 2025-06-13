// App.js

import "antd/dist/reset.css";
import { Layout } from "antd";
import Dashboard from "./components/Dashboard";
import { Routes, Route } from "react-router-dom";
import DeliveryPersonLogin from "./pages/DeliverPerson/DeliveryPersonLogin";
import DeliverPersonDashboard from "./pages/DeliverPersonDashboard/DeliverPersonDashboard";

const App = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/delivery-person-login"
          element={<DeliveryPersonLogin />}
        />
        <Route
          path="/delivery-dashboard"
          element={<DeliverPersonDashboard />}
        />
      </Routes>
    </Layout>
  );
};

export default App;
