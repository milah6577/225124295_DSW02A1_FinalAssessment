const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json()); // Essential for receiving JSON

mongoose.connect("mongodb://127.0.0.1:27017/helpdeskDB");

  //Question1.2
  const ticketSchema = new mongoose. Schema({
ticketld: { type: String, required: true, unique:true }, 
studentNumber: {type: String, required: true, match: /^\d{9}$/}, 
fullName: { type: String, required: true}, 
email: { type: String, required: true, match: /@.*\./ }, 
issueCategory: {type: String, required: true, enum: ["Network", "Hardware", "Software", "Login"] },
priorityLevel: { type: String, enum: ["Low", "Medium", "High"] }, 
description: { type: String, minlength: 10 }
})

//question1.3
app.get("/mock/tickets", (req, res) => {
    const mockTickets = 
[
  {
    ticketId: "T101",
    studentNumber: "221456789",
    fullName: "Lerato Mokoena",
    email: "lerato@uj.ac.za",
    issueCategory: "Network",
    priorityLevel: "High",
    description: "Cannot connect to campus WiFi from residence"
  },
  {
    ticketId: "T102",
    studentNumber: "22145",
    fullName: "Thabo N",
    email: "thabo@uj.ac.za",
    issueCategory: "Hardware",
    priorityLevel: "Medium",
    description: "Laptop problem"
  },
   {
    ticketId: "T103",
    studentNumber: "221987654",
    fullName: "",
    email: "amina@uj.ac.za",
    issueCategory: "Software",
    priorityLevel: "Urgent",
    description: "Need help installing required applications"
  },
   {
    ticketId: "T101",
    studentNumber: "220123456",
    fullName: "Sipho Dlamini",
    email: "sipho@uj.ac.za",
    issueCategory: "Login",
    priorityLevel: "Low",
    description: "Unable to log into student portal"
},
{
  "ticketId": "T105",
  "studentNumber": "225124295",
  "fullName": "Lindo Mathonsi",
  "email": "225124295@student.uj.ac.za",
  "issueCategory": "Software",
  "priorityLevel": "Medium",
  "description": "Issue with surname and student number ending 295"
}

];
  res.json(mockTickets);
});

//questin2.1
app.post("/tickets/import", async (req, res) => {
    const data = req.body; 

    let summary = { 
        totalProcessed: data.length, 
        totalInserted: 0, 
        totalRejected: 0, 
        rejectedTicketIds: [] 
    };
    
    for (let item of data) {
        try {
            const exists = await Ticket.findOne({ ticketId: item.ticketId });
            if (exists) {
                throw new Error("Duplicate ticket ID");
            }

            await Ticket.create(item);
            summary.totalInserted++;
        } catch (err) {
            summary.totalRejected++;
            summary.rejectedTicketIds.push({ 
                id: item.ticketId || "Unknown", 
                reason: err.message 
            });
        }
    }

    res.json(summary);
});

//questin3.1
app.post("/tickets", async (req, res) => {
    try {
        const newTicket = new Ticket(req.body);
        await newTicket.save();
        res.status(201).json(newTicket);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//question3.2
app.get("/tickets/:ticketId", async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//question3.3
app.put("/tickets/:ticketId", async (req, res) => {
    try {
        const updated = await Ticket.findOneAndUpdate(
            { ticketId: req.params.ticketId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: "Ticket not found" });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//question3.4
app.delete("/tickets/:ticketId", async (req, res) => {
    try {
        const result = await Ticket.deleteOne({ ticketId: req.params.ticketId });
        if (result.deletedCount === 0) return res.status(404).json({ message: "Ticket not found" });
        res.json({ message: "Ticket successfully deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Question4,1
app.get("/tickets/category/:type", async (req, res) => {
  const tickets = await Ticket.find({
    issueCategory: { $regex: new RegExp("^" + req.params.type + "$", "i") }
  });
  res.json(tickets);
});

//question4.2
app.get("/tickets/priority/high", async (req, res) => {
  const tickets = await Ticket.find({ priorityLevel: "High" });
  res.json(tickets);
});

//question4.3
app.get("/summary", async (req, res) => {
  const total = await Ticket.countDocuments();
  const high = await Ticket.countDocuments({ priorityLevel: "High" });
  const medium = await Ticket.countDocuments({ priorityLevel: "Medium" });
  const low = await Ticket.countDocuments({ priorityLevel: "Low" });

  const categoryCounts = await Ticket.aggregate([
    { $group: { _id: "$issueCategory", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const mostCommonCategory = categoryCounts[0]?._id || null;

  res.json({ total, high, medium, low, mostCommonCategory });
});

app.listen(3000, () => console.log("Server running on port 3000"));