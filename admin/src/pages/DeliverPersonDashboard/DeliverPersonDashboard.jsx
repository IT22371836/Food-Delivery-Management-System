import React, { act, useState } from "react";
import { Layout, Menu } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

import LeaveManagement from "../../components/LeaveManagement/LeaveManagement";
import OrderManagement from "../../components/OrderManagement/OrderManagement";

const { Content, Sider } = Layout;

const DeliverPersonDashboard = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };

  const handleMenuClick = (key) => {
    setActiveIndex(key);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
        <div className="logo" />
        <Menu theme="dark" defaultSelectedKeys={["1"]} mode="inline">
          <Menu.Item
            key="/"
            icon={<UserOutlined />}
            onClick={() => handleMenuClick(0)}
          >
            Dashboard
          </Menu.Item>
          <Menu.Item
            key="/leave"
            icon={<CalendarOutlined />}
            onClick={() => handleMenuClick(0)}
          >
            Leave Management
          </Menu.Item>
          <Menu.Item
            key="/orders"
            icon={<ShoppingCartOutlined />}
            onClick={() => handleMenuClick(1)}
          >
            Order Management
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Content style={{ margin: "0 16px" }}>
          <div
            className="site-layout-background"
            style={{ padding: 24, minHeight: 360 }}
          >
            {activeIndex === 0 ? <LeaveManagement /> : null}
            {activeIndex === 1 ? <OrderManagement /> : null}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DeliverPersonDashboard;
