import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeliveryPersonLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:4000/api/delivery-person/login",
        values
      );
      if (response.data.success) {
        message.success("Login successful");
        localStorage.setItem("deliveryPersonToken", response.data.data.token);
        navigate("/delivery-dashboard");

        localStorage.setItem("deliveryPersonEmail", values.email);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "0 auto", marginTop: 100 }}>
      <h2>Delivery Person Login</h2>
      <Form name="delivery_login" onFinish={onFinish}>
        <Form.Item
          name="nic"
          rules={[{ required: true, message: "Please input your NIC!" }]}
        >
          <Input placeholder="NIC" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input placeholder="Email" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Log in
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default DeliveryPersonLogin;
