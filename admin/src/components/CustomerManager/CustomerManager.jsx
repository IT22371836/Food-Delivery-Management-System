import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Card,
  Typography,
  Divider,
  Avatar,
  DatePicker,
  Tooltip,
  Badge,
  Spin,
  ConfigProvider,
  Image,
  Row,
  Col
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { baseUrl } from '../../constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Sample images (in a real app, these would be imported from your assets)
const headerImage = 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
const customerAvatar1 = 'https://randomuser.me/api/portraits/women/44.jpg';
const customerAvatar2 = 'https://randomuser.me/api/portraits/men/32.jpg';
const customerAvatar3 = 'https://randomuser.me/api/portraits/women/68.jpg';
const emptyStateImage = 'https://img.freepik.com/free-vector/no-data-concept-illustration_114360-626.jpg';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers, dateRange]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/user/list`);
      const formattedCustomers = response.data.data.map((customer, index) => ({
        ...customer,
        createdAt: customer.createdAt || new Date().toISOString(),
        // Add sample avatars for demo purposes
        avatar: [customerAvatar1, customerAvatar2, customerAvatar3][index % 3] || null
      }));
      setCustomers(formattedCustomers);
    } catch (error) {
      message.error("Failed to fetch customers");
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];
    
    if (searchTerm) {
      filtered = filtered.filter(
        customer =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phoneNumber?.includes(searchTerm)
      );
    }
    
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        return customerDate >= new Date(dateRange[0]) && customerDate <= new Date(dateRange[1]);
      });
    }
    
    setFilteredCustomers(filtered);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      address: customer.address
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/user/${id}`);
      message.success("Customer deleted successfully");
      await fetchCustomers();
    } catch (error) {
      message.error("Failed to delete customer");
      console.error("Error deleting customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const data = {
        name: values.name,
        email: values.email,
        phoneNumber: values.phoneNumber,
        address: values.address
      };

      await axios.put(`${baseUrl}/api/user/${editingCustomer._id}`, data);
      message.success("Customer updated successfully");
      
      setModalVisible(false);
      await fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to save customer");
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Customer Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableColumn = ["ID", "Name", "Email", "Phone", "Join Date"];
    const tableRows = filteredCustomers.map((customer) => [
      customer.uid || 'N/A',
      customer.name || 'N/A',
      customer.email || 'N/A',
      customer.phoneNumber || 'N/A',
      customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 }
      }
    });

    doc.save(`customers_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCustomers.map(customer => ({
        ID: customer.uid || 'N/A',
        Name: customer.name || 'N/A',
        Email: customer.email || 'N/A',
        Phone: customer.phoneNumber || 'N/A',
        Address: customer.address || 'N/A',
        'Join Date': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, `customers_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'customer',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.avatar}
            style={{ 
              backgroundColor: '#1890ff', 
              marginRight: 8,
              color: '#fff'
            }}
            icon={<UserOutlined />}
          />
          <div>
            <Text strong style={{ color: '#333' }}>{text || 'Unknown'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.uid || 'N/A'}
            </Text>
          </div>
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <MailOutlined style={{ marginRight: 8, color: '#666' }} />
            <Text style={{ color: '#444' }}>{record.email || 'N/A'}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PhoneOutlined style={{ marginRight: 8, color: '#666' }} />
            <Text style={{ color: '#444' }}>{record.phoneNumber || 'N/A'}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EnvironmentOutlined style={{ marginRight: 8, color: '#666' }} />
          <Text style={{ color: '#444' }}>{text || 'Not specified'}</Text>
        </div>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Text style={{ color: '#555' }}>
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </Text>
      ),
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              shape="circle" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              style={{ 
                backgroundColor: '#f0f9ff',
                borderColor: '#bae0ff',
                color: '#1890ff'
              }} 
            />
          </Tooltip>
          
          <Popconfirm
            title="Are you sure to delete this customer?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Tooltip title="Delete">
              <Button 
                shape="circle" 
                icon={<DeleteOutlined />} 
                style={{ 
                  backgroundColor: '#fff1f0',
                  borderColor: '#ffa39e',
                  color: '#ff4d4f'
                }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          colorBgContainer: '#f5f8fa',
        },
      }}
    >
      <div style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        padding: '20px'
      }}>
        {/* Header Image Section */}
        <div style={{ 
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <Image
            src={headerImage}
            preview={false}
            style={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              filter: 'brightness(0.9)'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            color: 'white'
          }}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <TeamOutlined style={{ marginRight: 12 }} />
              Customer Management
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Manage all your customer relationships in one place
            </Text>
          </div>
        </div>

        <Card 
          bordered={false}
          style={{ 
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)'
          }}
          headStyle={{
            borderBottom: '1px solid #e8e8e8',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderRadius: '12px 12px 0 0'
          }}
          extra={
            <Space>
              <Tooltip title="Export to PDF">
                <Button 
                  icon={<FilePdfOutlined />} 
                  onClick={generatePDF}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: '#f6ffed',
                    borderColor: '#b7eb8f',
                    color: '#52c41a'
                  }}
                />
              </Tooltip>
              <Tooltip title="Export to Excel">
                <Button 
                  icon={<FileExcelOutlined />} 
                  onClick={generateExcel}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: '#f0f9eb',
                    borderColor: '#95de64',
                    color: '#389e0d'
                  }}
                />
              </Tooltip>
            </Space>
          }
        >
          <div style={{ 
            marginBottom: 16,
            padding: '16px',
            background: 'linear-gradient(to right, #eef2f3, #e0eafc)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={10} lg={8}>
                <Input
                  placeholder="Search customers..."
                  prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    borderRadius: 6,
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={10} lg={8}>
                <RangePicker 
                  onChange={(dates) => setDateRange(dates)}
                  style={{ 
                    width: '100%',
                    borderRadius: 6,
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  placeholder={['Start Date', 'End Date']}
                />
              </Col>
            </Row>
          </div>
          
          <Divider style={{ margin: '16px 0', borderColor: '#e8e8e8' }} />
          
          <Spin spinning={loading} tip="Loading customers..." indicator={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Image
                src="https://img.icons8.com/ios/50/000000/spinner-frame-5.png"
                width={40}
                preview={false}
                style={{ marginBottom: 8, animation: 'spin 1s linear infinite' }}
              />
              <Text>Loading your customers...</Text>
            </div>
          }>
            {filteredCustomers.length > 0 ? (
              <Table
                columns={columns}
                dataSource={filteredCustomers}
                rowKey="_id"
                pagination={{
                  ...pagination,
                  total: filteredCustomers.length,
                  showSizeChanger: true,
                  showTotal: (total) => (
                    <Text strong style={{ color: '#1890ff' }}>
                      Showing {total} customers
                    </Text>
                  ),
                }}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                style={{ 
                  borderRadius: 8,
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
                rowClassName={() => 'customer-row'}
              />
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 0',
                background: '#fafafa',
                borderRadius: 8
              }}>
                <Image
                  src={emptyStateImage}
                  preview={false}
                  width={200}
                  style={{ marginBottom: 16 }}
                />
                <Title level={4} style={{ color: '#666' }}>
                  No customers found
                </Title>
                <Text type="secondary">
                  {searchTerm || dateRange.length > 0 ? 
                    "Try adjusting your search filters" : 
                    "You don't have any customers yet"}
                </Text>
              </div>
            )}
          </Spin>
          
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <EditOutlined style={{ marginRight: 8, color: '#667eea' }} />
                <span style={{ color: '#667eea' }}>Edit Customer</span>
              </div>
            }
            visible={modalVisible}
            onOk={handleModalOk}
            onCancel={() => setModalVisible(false)}
            confirmLoading={loading}
            width={700}
            footer={[
              <Button 
                key="back" 
                onClick={() => setModalVisible(false)}
                style={{
                  backgroundColor: '#f5f5f5',
                  borderColor: '#d9d9d9'
                }}
              >
                Cancel
              </Button>,
              <Button 
                key="submit" 
                type="primary" 
                loading={loading}
                onClick={handleModalOk}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Update
              </Button>,
            ]}
            bodyStyle={{
              background: '#f5f8fa',
              borderRadius: 8
            }}
          >
            <Form 
              form={form} 
              layout="vertical"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              <Form.Item
                name="name"
                label={
                  <span style={{ color: '#667eea', fontWeight: 500 }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    Full Name
                  </span>
                }
                rules={[{ required: true, message: 'Please input customer name!' }]}
              >
                <Input 
                  placeholder="Enter customer full name" 
                  style={{ backgroundColor: '#fff' }}
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                label={
                  <span style={{ color: '#667eea', fontWeight: 500 }}>
                    <MailOutlined style={{ marginRight: 8 }} />
                    Email
                  </span>
                }
                rules={[
                  { required: true, message: 'Please input email!' },
                  { type: 'email', message: 'Please enter valid email!' }
                ]}
              >
                <Input 
                  placeholder="Enter customer email" 
                  style={{ backgroundColor: '#fff' }}
                />
              </Form.Item>
              
              <Form.Item
                name="phoneNumber"
                label={
                  <span style={{ color: '#667eea', fontWeight: 500 }}>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    Phone Number
                  </span>
                }
                rules={[
                  { required: true, message: 'Please input phone number!' }
                ]}
              >
                <Input 
                  placeholder="Enter customer phone number" 
                  style={{ backgroundColor: '#fff' }}
                />
              </Form.Item>
              
              <Form.Item
                name="address"
                label={
                  <span style={{ color: '#667eea', fontWeight: 500 }}>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    Address
                  </span>
                }
                rules={[{ required: true, message: 'Please input address!' }]}
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Enter customer address" 
                  style={{ backgroundColor: '#fff' }}
                />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      </div>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        body {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
        .customer-row:hover {
          background-color: #f0f9ff !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
          transition: all 0.3s ease;
        }
        .ant-table-thead > tr > th {
          background-color: #e6f7ff !important;
          color: #333 !important;
          font-weight: 600 !important;
          border-bottom: 2px solid #d9e8ff !important;
        }
        .ant-card-head-title {
          color: #fff !important;
          font-weight: 500 !important;
        }
        .ant-card {
          transition: all 0.3s ease;
        }
        .ant-card:hover {
          box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
        }
        .ant-btn-circle {
          transition: all 0.2s ease;
        }
        .ant-btn-circle:hover {
          transform: scale(1.1);
        }
        .ant-image {
          display: block;
        }
        .ant-image-img {
          border-radius: 8px;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default CustomerManager;