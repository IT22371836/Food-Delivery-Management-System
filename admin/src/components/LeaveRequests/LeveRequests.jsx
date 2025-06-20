import React, { useState, useEffect } from "react";
import { Table, Space, Button, Select, Input, message, Popconfirm } from "antd";
import axios from "axios";

const { Option } = Select;
const { Search } = Input;

const LeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:4000/api/leave-requests"
      );
      setLeaveRequests(response.data.data);
    } catch (error) {
      message.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`http://localhost:4000/api/leave-requests/${id}`, {
        status,
      });
      message.success("Status updated successfully");
      fetchLeaveRequests();
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/leave-requests/${id}`);
      message.success("Leave request deleted successfully");
      fetchLeaveRequests();
    } catch (error) {
      message.error("Failed to delete leave request");
    }
  };

  const handleSearch = (value) => {
    const filteredRequests = leaveRequests.filter(
      (request) =>
        request.requestedBy.toLowerCase().includes(value.toLowerCase()) ||
        request.reason.toLowerCase().includes(value.toLowerCase())
    );
    setLeaveRequests(filteredRequests);
  };

  const columns = [
    { title: "Requested By", dataIndex: "requestedBy", key: "requestedBy" },
    {
      title: "From",
      dataIndex: "dateFrom",
      key: "dateFrom",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "To",
      dataIndex: "dateTo",
      key: "dateTo",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          defaultValue={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record._id, value)}
        >
          <Option value="Pending">Pending</Option>
          <Option value="Approved">Approved</Option>
          <Option value="Rejected">Rejected</Option>
        </Select>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Are you sure you want to delete this leave request?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Leave Requests</h2>
      <Search
        placeholder="Search by employee or reason"
        onSearch={handleSearch}
        style={{ width: 300, marginBottom: 16 }}
      />
      <Table
        columns={columns}
        dataSource={leaveRequests}
        loading={loading}
        rowKey="_id"
      />
    </div>
  );
};

export default LeaveRequests;
