import { useState, useEffect, useRef } from "react";
import { Table, Input, Space, message, Button, Popconfirm, Select } from "antd";
import axios from "axios";
import { baseUrl } from "../../constants";
import UserDetailsBox from "../../components/Common/UserDetailsBox";
import { DeleteOutlined, FilePdfOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CustomerMessages = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const tableRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    handleSearch(searchText);
  }, [messages, searchText]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/customer-message/list`);
      setMessages(response.data.data);
      setFilteredMessages(response.data.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      message.error("Failed to fetch messages");
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = messages.filter((message) =>
      Object.values(message).some((val) =>
        val.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredMessages(filtered);
  };

  const generatePDF = async () => {
    if (!filteredMessages.length) {
      message.warning("No data to generate PDF");
      return;
    }

    message.loading("Generating PDF...", 0);
    
    try {
      const input = tableRef.current;
      
      // Create a clone of the table to apply PDF-specific styles
      const clone = input.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.width = "100%";
      document.body.appendChild(clone);

      // Apply styles for PDF
      const table = clone.querySelector(".ant-table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      
      // Style header cells
      const headerCells = clone.querySelectorAll(".ant-table-thead th");
      headerCells.forEach(cell => {
        cell.style.backgroundColor = "#4a6fdc";
        cell.style.color = "white";
        cell.style.padding = "8px";
        cell.style.border = "1px solid #ddd";
      });
      
      // Style body cells
      const bodyCells = clone.querySelectorAll(".ant-table-tbody td");
      bodyCells.forEach((cell, index) => {
        cell.style.padding = "8px";
        cell.style.border = "1px solid #ddd";
        // Alternate row colors
        const rowIndex = Math.floor(index / columns.length);
        if (rowIndex % 2 === 0) {
          cell.style.backgroundColor = "#f8fafc";
        } else {
          cell.style.backgroundColor = "#ffffff";
        }
      });

      const canvas = await html2canvas(clone, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape");
      const imgWidth = 280; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
      
      // Add title and date
      pdf.setFontSize(18);
      pdf.setTextColor(40);
      pdf.text("Customer Messages Report", 140, 15, { align: "center" });
      
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 140, 22, { align: "center" });
      
      pdf.save("customer_messages_report.pdf");
      message.destroy();
      message.success("PDF generated successfully");
    } catch (error) {
      message.destroy();
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF");
    }
  };

  const columns = [
    {
      title: "Message ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <span style={{ color: "#4a6fdc", fontWeight: 500 }}>{id}</span>,
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      render: (userId) => <UserDetailsBox id={userId} />,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <a href={`mailto:${email}`} style={{ color: "#4a6fdc" }}>{email}</a>,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text) => <span style={{ color: "#4a5568" }}>{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          onChange={(val) => {
            handleEdit(record._id, { status: val });
          }}
          defaultValue={record.status}
          style={{
            width: 120,
            backgroundColor: status === "resolved" ? "#e6ffed" : "#fff7e6",
            borderRadius: 4,
          }}
        >
          <Select.Option value="pending" style={{ color: "#fa8c16" }}>Pending</Select.Option>
          <Select.Option value="resolved" style={{ color: "#52c41a" }}>Resolved</Select.Option>
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this message?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ style: { backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" } }}
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              style={{ 
                backgroundColor: "#fff1f0",
                borderColor: "#ffa39e",
                color: "#ff4d4f"
              }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = async (id, data) => {
    setLoading(true);
    try {
      await axios.put(`${baseUrl}/api/customer-message/${id}`, data);
      message.success("Message updated successfully");
      fetchMessages();
    } catch (error) {
      console.error("Error updating message:", error);
      message.error("Failed to update message");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/customer-message/${id}`);
      message.success("Message deleted successfully");
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      message.error("Failed to delete message");
    }
    setLoading(false);
  };

  return (
    <div style={{
      backgroundColor: "#rgba(122, 90, 90, 0.05)",
      minHeight: "100vh",
      padding: "24px"
    }}>
      <div style={{
        backgroundColor: "rgba(167, 171, 185, 0.9)",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(219, 70, 70, 0.05)"
      }}>
        <h1 style={{ 
          marginBottom: "24px",
          color: "#rgba(205, 33, 33, 0.85)",
          fontSize: "24px",
          fontWeight: 600
        }}>
          Customer Messages
        </h1>
        <Space style={{ marginBottom: 24 }}>
          <Input
            placeholder="Search messages..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ 
              width: 240,
              borderRadius: "6px",
              borderColor: "#e2e8f0",
              padding: "8px 12px"
            }}
          />
          <Button 
            type="primary" 
            icon={<FilePdfOutlined />} 
            onClick={generatePDF}
            disabled={loading || !filteredMessages.length}
            style={{
              backgroundColor: "#4a6fdc",
              borderColor: "#4a6fdc",
              borderRadius: "6px",
              fontWeight: 500
            }}
          >
            Generate PDF
          </Button>
        </Space>
        <div ref={tableRef}>
          <Table
            columns={columns}
            dataSource={filteredMessages}
            rowKey="_id"
            loading={loading}
            pagination={false}
            bordered
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #e2e8f0"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerMessages;