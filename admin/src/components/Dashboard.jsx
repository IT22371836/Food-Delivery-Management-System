// Dashboard.js
import { useState } from "react";
import { Button, Layout, Menu, Popconfirm } from "antd";
import {
  ShoppingOutlined,
  UserOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  CarOutlined,
  TeamOutlined,
  LeftCircleFilled,
  MessageFilled,
  BarChartOutlined,
} from "@ant-design/icons";
import ItemManager from "./ItemManager/ItemManager";
import CustomerManager from "./CustomerManager/CustomerManager";
import ReviewManager from "./ReviewManager/ReviewManager";
import DeliveryPersonManager from "./DeliverPersonManager/DeliverPersonManager";
import OrderManager from "./OrderManager/OrderManager";
import DeliveryManager from "./DeliveryManager/DeliveryManager";
import CustomerMessages from "./CustomerMessages/CustomerMessages";
import LeaveRequests from "./LeaveRequests/LeveRequests";
import Analytics from "./Analytics/Analytics";

const { Header, Content, Sider } = Layout;

const Dashboard = () => {
  const [selectedKey, setSelectedKey] = useState("1");

  const menuItems = [
    { key: "1", icon: <ShoppingOutlined />, label: "Item Manager" },
    { key: "2", icon: <UserOutlined />, label: "Customer Manager" },
    { key: "3", icon: <StarOutlined />, label: "Review Manager" },
    { key: "4", icon: <ShoppingCartOutlined />, label: "Order Manager" },
    { key: "5", icon: <CarOutlined />, label: "Delivery Manager" },
    { key: "6", icon: <BarChartOutlined />, label: "Analytics" },
    { key: "7", icon: <MessageFilled />, label: "Customer Messages" },
   
  ];
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "http://localhost:5174/";
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} className="site-layout-background">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ height: "100%", borderRight: 0 }}
          items={menuItems}
          onSelect={({ key }) => setSelectedKey(key)}
        />
      </Sider>
      <Layout>
        <Header className="header">
          <div className="logo" />
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={["1"]}>
            <Menu.Item key="1">Dashboard</Menu.Item>
          </Menu>{" "}
        </Header>
        <Content
          className="site-layout-background"
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
          }}
        >
          {selectedKey === "1" && <ItemManager />}
          {selectedKey === "2" && <CustomerManager />}
          {selectedKey === "3" && <ReviewManager />}
          {selectedKey === "4" && <OrderManager />}
          {selectedKey === "5" && <DeliveryManager />}
          {selectedKey === "6" && <Analytics />}
          {selectedKey === "7" && <CustomerMessages />}
         
        </Content>{" "}
        <Popconfirm
          title="Are you sure you want to log out?"
          onConfirm={handleLogout}
          okText="Yes"
          cancelText="No"
        >
          <Button danger type="primary">
            Logout
          </Button>
        </Popconfirm>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
