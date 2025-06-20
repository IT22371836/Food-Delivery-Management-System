import LeaveRequestModel from "../models/leaveRequestModel.js";

export const createLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = new LeaveRequestModel(req.body);
    await leaveRequest.save();
    res.status(201).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequestModel.find();
    res.status(200).json({ success: true, data: leaveRequests });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequestModel.findById(req.params.id);
    if (!leaveRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }
    res.status(200).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequestModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!leaveRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }
    res.status(200).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequestModel.findByIdAndDelete(
      req.params.id
    );
    if (!leaveRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
