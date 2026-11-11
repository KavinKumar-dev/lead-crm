# Multi-Client Lead Management & Follow-Up CRM System

## 1. Project Overview

The objective is to build a centralized Lead Management and Follow-Up System that allows multiple clients to manage their leads through individual login accounts.

The system will have two main user roles:

1. Admin (Main Account)
2. Client (Individual Account)

The Admin will have complete access to all clients and their lead management activities.

Each client will have a separate account where they can upload leads, update follow-up stages, record customer interactions and track conversions.

The Admin must be able to monitor all clients' activities from a single dashboard.

---

## 2. User Roles & Access

### A. Admin Dashboard

The Admin is the main controller of the entire system.

Admin functionalities:

- Create new client accounts.
- Generate a unique 5-digit Client ID for every client.
- Access all registered client accounts.
- View individual client dashboards.
- Monitor all leads from every client.
- View follow-up activities and customer responses.
- Track converted and pending leads.
- Monitor client-wise performance.
- Filter leads by date, client, status and follow-up stage.
- View today's activities across all clients.
- Edit or update lead information when required.
- Manage and deactivate client accounts.
- Download and export lead reports.

**Important:** The Admin should be able to switch between different client accounts using their Client ID without needing separate logins.

### B. Client Dashboard

Each client will have an individual login account.

Client functionalities:

- Login using their assigned Client ID and password.
- Upload new leads manually.
- View all their uploaded leads.
- Edit lead information.
- Update follow-up stages.
- Add follow-up notes.
- Record customer responses.
- Update lead status.
- Mark leads as converted or lost.
- View their daily and overall performance.
- Filter leads by date and status.
- View today's follow-up tasks.

**Important:** A client must only be able to access their own leads and information. They must not be able to view other clients' data.

---

## 3. Client Account Creation

Every client account must have:

- Client Name
- Business Name
- Unique 5-Digit Client ID
- Login Password
- Account Creation Date
- Account Status (Active / Inactive)

Example:

- Client A – ID: 10245
- Client B – ID: 20356
- Client C – ID: 30467

Each Client ID must be unique.

---

## 4. Lead Management System

Clients should be able to upload and manage leads generated through our marketing strategies and advertising campaigns.

Each lead should contain the following information:

| Field | Description |
|---|---|
| Lead ID | Unique lead identification number |
| Lead Name | Customer name |
| Mobile Number | Customer contact number |
| Lead Source | Instagram / Facebook / WhatsApp / Other |
| Campaign Name | Campaign through which the lead was generated |
| Lead Created Date | Date the lead entered the system |
| Follow-Up Date | Next scheduled follow-up |
| Lead Status | Current lead status |
| Follow-Up Stage | Current follow-up stage |
| Remarks | Additional information |

The system should automatically record the date and time when a lead is uploaded.

---

## 5. Follow-Up Management System

This is one of the most important features of the project.

Every lead should have a structured follow-up process.

### Follow-Up Stages

1. **Initial Contact:** First message or call has been made.
2. **Follow-Up 1:** First reminder sent if the customer does not respond.
3. **Follow-Up 2:** Second reminder or follow-up attempt.
4. **Follow-Up 3:** Final follow-up attempt.

After these stages, the lead should be categorized based on its outcome.

### Lead Status Options

- New Lead
- Contacted
- Interested
- Not Responding
- Follow-Up Required
- Converted
- Lost

Clients should be able to:

- Update the current follow-up stage.
- Add notes after every call or conversation.
- Record customer responses.
- Set the next follow-up date.
- View previous follow-up history.
- Track how many times a customer has been contacted.

Every follow-up update must be saved with its date and time.

The system should maintain a complete follow-up history for each lead.

---

## 6. Lead Conversion Tracking

The system must clearly track the conversion journey of every lead.

When a lead becomes a customer, the client should be able to mark it as Converted.

Conversion details should include:

- Customer Name
- Contact Number
- Conversion Date
- Product / Service Purchased
- Order Value (Optional)
- Remarks

The system should automatically calculate:

- Total Leads
- Total Contacted Leads
- Interested Leads
- Pending Leads
- Converted Leads
- Lost Leads
- Overall Conversion Rate

Conversion Rate = (Converted Leads / Total Leads) × 100

---

## 7. Dashboard & Date-Wise Filters

Both Admin and Client dashboards should have date-wise filtering options.

Required Date Filters:

- Today
- Yesterday
- Last 7 Days
- Last 30 Days
- This Month
- Last Month
- Custom Date Range

### Today's Dashboard

The system should provide a dedicated Today section displaying:

- Today's New Leads
- Today's Follow-Ups
- Overdue Follow-Ups
- Today's Converted Leads
- Pending Customer Responses
- Today's Lost Leads

The Admin should be able to view today's activities across all clients.

The Client should only see their own activities.

---

## 8. Admin – Overall Client Monitoring

The Admin Dashboard must provide a centralized overview of all clients.

Example:

| Client | Total Leads | Converted | Pending |
|---|---|---|---|
| Client A | 150 | 25 | 80 |
| Client B | 100 | 18 | 55 |
| Client C | 200 | 40 | 110 |

The Admin should be able to:

- View all clients in one place.
- Open any individual client's dashboard.
- Monitor their daily lead activities.
- Check their follow-up progress.
- Compare client-wise conversions.
- Identify clients with pending follow-ups.
- Check overall marketing lead performance.

The Admin must also have a global search option to find a lead using its name, mobile number or Lead ID.

---

## 9. Reports & Analytics

The system should generate reports for both Admin and Clients.

### Client Reports

- Daily Lead Report
- Weekly Lead Report
- Monthly Lead Report
- Follow-Up Report
- Conversion Report
- Lost Lead Report

### Admin Reports

- Overall Lead Generation Report
- Client-Wise Performance Report
- Date-Wise Lead Report
- Client-Wise Conversion Report
- Overall Conversion Rate

Reports should be downloadable in Excel or CSV format.

---

## 10. Notifications & Reminders

The system should provide internal notifications for:

- New leads uploaded.
- Follow-ups due today.
- Overdue follow-ups.
- Leads awaiting action.
- Lead conversion updates.

A notification indicator should be available on the dashboard.

---

## 11. User Interface & Design

The application should have a clean, modern and professional interface.

### Required pages

**Admin Side:**

1. Admin Login
2. Admin Dashboard
3. Client Management
4. Individual Client Dashboard
5. All Leads
6. Follow-Up Management
7. Conversion Tracking
8. Reports & Analytics
9. Settings

**Client Side:**

1. Client Login
2. Client Dashboard
3. Add New Lead
4. All Leads
5. Follow-Up Management
6. Lead Details & History
7. Converted Leads
8. Reports

The application should be responsive and work smoothly on both desktop and mobile devices.

---

## 12. Security & Data Management

- Each client must have isolated data access.
- Only Admin can access all client accounts.
- Clients must not access other clients' leads.
- Passwords must be securely encrypted.
- All lead updates must be saved in the database.
- Maintain timestamps for lead creation and updates.
- Maintain an activity history for important changes.
- Provide secure login and logout functionality.

---

## 13. Expected Project Outcome

The final application should function as a centralized CRM platform where:

- One Admin can manage multiple clients.
- Every client has a separate login and dashboard.
- Clients can upload and manage their own leads.
- Every lead has a structured follow-up journey.
- Customer interactions and conversion details are recorded.
- Admin can monitor all client activities from one place.
- Daily, weekly and monthly reports are available.
- Date-wise filtering and performance tracking work across the entire system.

The main objective is to create a single platform to manage multiple clients, monitor marketing-generated leads, improve follow-up consistency and measure actual lead conversions.

---

# SYSTEM WORKFLOW

## 1. Admin Account

- Admin logs into the main dashboard.
- Creates individual client accounts.
- Generates a unique 5-digit Client ID.
- Assigns login credentials to each client.
- Manages and monitors all client accounts.

## 2. Client Login

- Client logs in using their Client ID and password.
- Accesses their individual dashboard.
- Can view and manage only their own leads.

## 3. Lead Upload

- Client receives leads generated through our marketing campaigns.
- Uploads leads manually or through Excel.
- Enters customer name and mobile number.
- Selects lead source and campaign name.
- System automatically records lead creation date and time.
- Each lead receives a unique Lead ID.

## 4. Lead Management

- Client views all uploaded leads.
- Checks customer details.
- Updates lead status.
- Adds remarks and customer requirements.
- Sets the next follow-up date.

## 5. Follow-Up Process

- **Initial Contact:** First call or message to the customer.
- **Follow-Up 1:** First reminder if there is no response.
- **Follow-Up 2:** Second reminder or contact attempt.
- **Follow-Up 3:** Final follow-up attempt.

After every interaction:

- Update customer response.
- Add follow-up notes.
- Record date and time.
- Schedule the next follow-up.

## 6. Lead Outcome

- **Converted:** Customer confirms the purchase. Update conversion date. Record product/service and order value.
- **Lost:** Customer is not interested or does not convert. Record the reason.
- **Pending:** Customer requires more time or another follow-up.

## 7. Client Dashboard

- Total Leads
- New Leads
- Contacted Leads
- Interested Leads
- Follow-Ups Due Today
- Overdue Follow-Ups
- Converted Leads
- Lost Leads
- Conversion Rate

Date Filters: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, Custom Date Range

## 8. Admin Dashboard

- Admin logs into the main dashboard.
- Views all registered clients.
- Searches clients using their Client ID.
- Opens individual client dashboards.
- Monitors all client leads and follow-up activities.
- Checks converted, pending and lost leads.
- Monitors today's activities across all clients.
- Compares client-wise performance.
- Filters all leads by date, client and status.
- Exports individual and overall reports.

## 9. Reports & Analytics

- Daily Lead Report
- Weekly Lead Report
- Monthly Lead Report
- Client-Wise Performance Report
- Follow-Up Report
- Conversion Report
- Lost Lead Report
- Overall Conversion Rate

## Final Workflow

Admin creates multiple client accounts → Client logs in and uploads leads → Lead management (updates customer information) → Follow-up tracking (Initial Contact, Follow-Up 1, Follow-Up 2, Follow-Up 3) → Lead conversion (Converted / Lost / Pending) → Client reports → Centralized Admin Dashboard (monitors all clients, tracks all leads, checks follow-up activities, measures conversions, generates overall reports).

---

## IMPORTANT SYSTEM RULE

Each client must have a separate account and isolated data. Clients can access only their own leads, while the Admin has complete access to all clients and their activities.

The system must automatically save all lead updates, follow-up history, conversion details and timestamps.
