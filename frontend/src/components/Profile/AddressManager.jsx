import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

const AddressContainer = styled.div`
  margin-top: 30px;
  width: 100%;
`;

const AddressTitle = styled.h2`
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const AddressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const AddressCard = styled.div`
  background-color: #ecf0f1;
  border-radius: 5px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const AddressText = styled.p`
  margin-bottom: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 8px 15px;
  font-size: 14px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
`;

const UpdateButton = styled(Button)`
  background-color: #3498db;
  &:hover {
    background-color: #2980b9;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #e74c3c;
  &:hover {
    background-color: #c0392b;
  }
`;

const AddressForm = styled.form`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
`;

const Input = styled.input`
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 5px;
  font-size: 16px;
`;

const SubmitButton = styled(Button)`
  background-color: #2ecc71;
  &:hover {
    background-color: #27ae60;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
`;

const AddressManager = ({ userId, token }) => {
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(
        `http://localhost:4000/api/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}`, token: token },
        }
      );
      setAddresses(response.data.user.addresses || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:4000/api/user/${userId}/address`,
        newAddress,
        {
          headers: { Authorization: `Bearer ${token}`, token: token },
        }
      );
      setNewAddress({ street: "", city: "", state: "", zipCode: "" });
      fetchAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:4000/api/user/${userId}/address/${currentAddress._id}`,
        newAddress,
        {
          headers: { Authorization: `Bearer ${token}`, token: token },
        }
      );
      setIsModalOpen(false);
      fetchAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  const handleDelete = async (addressId) => {
    try {
      await axios.delete(
        `http://localhost:4000/api/user/${userId}/address/${addressId}`,
        {
          headers: { Authorization: `Bearer ${token}`, token: token },
        }
      );
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const openUpdateModal = (address) => {
    setCurrentAddress(address);
    setNewAddress(address);
    setIsModalOpen(true);
  };

  return (
    <AddressContainer>
      <AddressTitle>Addresses</AddressTitle>
      <AddressGrid>
        {addresses.map((address) => (
          <AddressCard key={address._id}>
            <AddressText>{address.street}</AddressText>
            <AddressText>
              {address.city}, {address.state} {address.zipCode}
            </AddressText>
            <ButtonGroup>
              <UpdateButton onClick={() => openUpdateModal(address)}>
                Update
              </UpdateButton>
              <DeleteButton onClick={() => handleDelete(address._id)}>
                Delete
              </DeleteButton>
            </ButtonGroup>
          </AddressCard>
        ))}
      </AddressGrid>
      <AddressForm onSubmit={handleSubmit}>
        <Input
          type="text"
          name="street"
          value={newAddress.street}
          onChange={handleInputChange}
          placeholder="Street"
          required
        />
        <Input
          type="text"
          name="city"
          value={newAddress.city}
          onChange={handleInputChange}
          placeholder="City"
          required
        />
        <Input
          type="text"
          name="state"
          value={newAddress.state}
          onChange={handleInputChange}
          placeholder="State"
          required
        />
        <Input
          type="text"
          name="zipCode"
          value={newAddress.zipCode}
          onChange={handleInputChange}
          placeholder="Zip Code"
          required
        />
        <SubmitButton type="submit">Add Address</SubmitButton>
      </AddressForm>
      {isModalOpen && (
        <Modal>
          <ModalContent>
            <AddressForm onSubmit={handleUpdate}>
              <Input
                type="text"
                name="street"
                value={newAddress.street}
                onChange={handleInputChange}
                placeholder="Street"
                required
              />
              <Input
                type="text"
                name="city"
                value={newAddress.city}
                onChange={handleInputChange}
                placeholder="City"
                required
              />
              <Input
                type="text"
                name="state"
                value={newAddress.state}
                onChange={handleInputChange}
                placeholder="State"
                required
              />
              <Input
                type="text"
                name="zipCode"
                value={newAddress.zipCode}
                onChange={handleInputChange}
                placeholder="Zip Code"
                required
              />
              <ButtonGroup>
                <SubmitButton type="submit">Update Address</SubmitButton>
                <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              </ButtonGroup>
            </AddressForm>
          </ModalContent>
        </Modal>
      )}
    </AddressContainer>
  );
};

export default AddressManager;