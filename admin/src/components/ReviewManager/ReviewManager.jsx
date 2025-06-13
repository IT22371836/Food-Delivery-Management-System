import { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Card,
  Typography,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { baseUrl } from "../../constants";
import SentimentAnalysis from "./SentimentAnalysis";

const { Option } = Select;
const { Title } = Typography;

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingReview, setEditingReview] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    fetchReviews();
    fetchUsers();
  }, []);

  useEffect(() => {
    handleSearch(searchText);
  }, [reviews, searchText]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/review/list`);
      setReviews(response.data);
      setFilteredReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      message.error("Failed to fetch reviews");
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/user/list`);
      setUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to fetch users");
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = reviews.filter((review) =>
      Object.values(review).some((val) =>
        val?.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredReviews(filtered);
  };

  const handleEdit = (record) => {
    setEditingReview(record);
    form.setFieldsValue({
      ...record,
      reviewedBy: record.reviewedBy?._id,
      orderId: record.orderId?._id,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/review/${id}`);
      await fetchReviews();
      message.success("Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      message.error("Failed to delete review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      if (editingReview) {
        await axios.put(`${baseUrl}/api/review/${editingReview._id}`, values);
        message.success("Review updated successfully");
      } else {
        await axios.post(`${baseUrl}/api/review/create`, values);
        message.success("Review created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchReviews();
    } catch (error) {
      console.error("Error saving review:", error);
      message.error("Failed to save review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingReview(null);
    setOrderItems([]);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Reviews Report", 14, 15);

    const tableColumn = [
      "ID",
      "Reviewed By",
      "Review",
      "Rate",
      "Order ID",
      "Date",
    ];
    const tableRows = filteredReviews.map((review) => [
      review.rid,
      review.reviewedBy?.name,
      review.review,
      review.rate,
      review.orderId?._id,
      new Date(review.createdAt).toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [236, 240, 241]
      }
    });

    doc.save("reviews_report.pdf");
  };

  const getRateColor = (rate) => {
    switch (rate) {
      case "😞": return "#e74c3c";
      case "😐": return "#f39c12";
      case "🙂": return "#2ecc71";
      case "😊": return "#27ae60";
      case "😄": return "#16a085";
      default: return "#3498db";
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "rid",
      key: "rid",
      width: 80,
      render: (text) => <span style={{ fontWeight: 'bold' }}>#{text}</span>,
    },
    {
      title: "Reviewed By",
      dataIndex: ["reviewedBy", "name"],
      key: "reviewedBy",
      render: (text) => <span style={{ color: '#2980b9' }}>{text}</span>,
    },
    {
      title: "Review",
      dataIndex: "review",
      key: "review",
      sorter: (a, b) => a.review.localeCompare(b.review),
      render: (text) => <div style={{ maxWidth: 300 }}>{text}</div>,
    },
    {
      title: "Sentiment",
      dataIndex: "review",
      key: "sentiment",
      render: (review) => <SentimentAnalysis review={review} />,
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      render: (rate) => (
        <span style={{ 
          fontSize: 20,
          color: getRateColor(rate),
          display: 'inline-block',
          width: '100%',
          textAlign: 'center'
        }}>
          {rate}
        </span>
      ),
      filters: [
        { text: "😞", value: "😞" },
        { text: "😐", value: "😐" },
        { text: "🙂", value: "🙂" },
        { text: "😊", value: "😊" },
        { text: "😄", value: "😄" },
      ],
      onFilter: (value, record) => record.rate === value,
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (orderId) => (
        <span style={{ fontFamily: 'monospace', color: '#7f8c8d' }}>
          {orderId?.oid || orderId || "N/A"}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span style={{ color: '#7f8c8d' }}>
          {new Date(date).toLocaleDateString()}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={{ color: '#3498db' }}
          />
          <Popconfirm
            title="Are you sure you want to delete this review?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
              loading={actionLoading}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      background: '#f5f7fa',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Card
        bordered={false}
        style={{ 
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          background: 'white'
        }}
      >
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={3} style={{ color: '#2c3e50', margin: 0 }}>
              Review Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="Search reviews..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Button 
                type="primary" 
                icon={<FilePdfOutlined />} 
                onClick={generatePDF}
                style={{ background: '#e74c3c', borderColor: '#e74c3c' }}
              >
                Export PDF
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredReviews}
          rowKey="_id"
          loading={loading}
          bordered
          scroll={{ x: true }}
          style={{ borderRadius: 8 }}
          rowClassName={() => 'review-table-row'}
        />
      </Card>

      <Modal
        title={
          <span style={{ color: editingReview ? '#3498db' : '#2ecc71' }}>
            {editingReview ? "Edit Review" : "Add New Review"}
          </span>
        }
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={actionLoading}
        destroyOnClose
        bodyStyle={{ padding: '24px 24px 0' }}
        footer={[
          <Button key="back" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={actionLoading}
            onClick={handleModalOk}
            style={{ background: editingReview ? '#3498db' : '#2ecc71', borderColor: editingReview ? '#3498db' : '#2ecc71' }}
          >
            {editingReview ? "Update" : "Create"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reviewedBy"
            label="Reviewed By"
            rules={[{ required: true, message: "Please select a user" }]}
          >
            <Select 
              placeholder="Select User"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="review"
            label="Review"
            rules={[{ required: true, message: "Please enter a review" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter your review here..." />
          </Form.Item>

          <Form.Item
            name="rate"
            label="Rating"
            rules={[{ required: true, message: "Please select a rating" }]}
          >
            <Select placeholder="Select Rating">
              <Option value="😞">😞 Poor</Option>
              <Option value="😐">😐 Average</Option>
              <Option value="🙂">🙂 Good</Option>
              <Option value="😊">😊 Very Good</Option>
              <Option value="😄">😄 Excellent</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="orderId"
            label="Order ID"
            rules={[{ required: true, message: "Please select an order" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select Order"
              onChange={async (value) => {
                try {
                  const response = await axios.get(
                    `${baseUrl}/api/order/${value}`
                  );
                  setOrderItems(response.data.items);
                } catch (error) {
                  console.error("Error fetching order items:", error);
                  message.error("Failed to fetch order items");
                }
              }}
            >
              {reviews.map((review) => (
                <Option key={review.orderId?._id} value={review.orderId?._id}>
                  {review.orderId?._id}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {orderItems.length > 0 && (
            <Form.Item
              name="itemId"
              label="Item"
              rules={[{ required: true, message: "Please select an item" }]}
            >
              <Select placeholder="Select Item">
                {orderItems.map((item) => (
                  <Option key={item.oid} value={item.oid}>
                    {item.name} (ID: {item.oid})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <style jsx global>{`
        .review-table-row:hover td {
          background-color: #f0f7ff !important;
        }
        .ant-table-thead > tr > th {
          background-color: #34495e !important;
          color: white !important;
          font-weight: 600 !important;
        }
        .ant-table-tbody > tr > td {
          transition: background-color 0.3s;
        }
        .ant-modal-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        .ant-modal-title {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ReviewManager;