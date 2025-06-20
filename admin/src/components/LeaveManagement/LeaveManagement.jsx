import React, { useState } from "react";
import { Form, DatePicker, Input, Button, message } from "antd";
import axios from "axios";

const { RangePicker } = DatePicker;

const LeaveManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const requestedBy = localStorage.getItem("deliveryPersonEmail");

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { dateRange, reason } = values;
      const leaveRequest = {
        requestedBy,
        dateFrom: dateRange[0].toISOString(),
        dateTo: dateRange[1].toISOString(),
        reason,
      };
      await axios.post(
        "http://localhost:4000/api/leave-requests",
        leaveRequest
      );
      message.success("Leave request submitted successfully");
      form.resetFields();
    } catch (error) {
      message.error("Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Submit Leave Request</h2>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="dateRange"
          label="Leave Date Range"
          rules={[{ required: true, message: "Please select date range" }]}
        >
          <RangePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Please enter reason for leave" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Leave Request
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LeaveManagement;
