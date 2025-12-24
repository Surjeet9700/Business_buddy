# 🏢 Business Buddy

> **Enterprise Form & Workflow Management Platform**

A modern, full-stack enterprise application for managing forms, submissions, and approval workflows. Built with React, TypeScript, Node.js, and PostgreSQL.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

---

## ✨ Features

### 📋 Dynamic Form Builder
- **Drag-and-drop interface** for building forms
- 7+ field types (text, email, number, date, dropdown, textarea, checkbox)
- Real-time field configuration with live preview
- Form versioning and schema management

### 📝 Submission Management
- Submit, review, and track form submissions
- Rich submission details with form responses
- Filter by status, form type, or date range

### ✅ Approval Workflows
- Multi-step approval workflows
- Approve/reject submissions with comments
- Workflow status tracking and history

### 📊 Analytics Dashboard
- Real-time KPIs and metrics
- Submission trends visualization
- Form usage distribution charts
- Approval rate tracking

### 🎨 Modern UI/UX
- Dark/Light theme support
- Responsive design for all devices
- Enterprise-grade aesthetics
- Smooth animations and transitions

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI[UI Components]
        Pages[Pages]
        Services[API Services]
        State[React Query State]
    end
    
    subgraph Backend["Backend (Node.js + Express)"]
        Routes[REST Routes]
        Controllers[Controllers]
        ServicesB[Business Services]
        Prisma[Prisma ORM]
    end
    
    subgraph Database["Database"]
        PostgreSQL[(PostgreSQL)]
    end
    
    UI --> Pages
    Pages --> Services
    Services --> State
    State --> Routes
    Routes --> Controllers
    Controllers --> ServicesB
    ServicesB --> Prisma
    Prisma --> PostgreSQL
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **State Management** | TanStack React Query |
| **UI Components** | Radix UI, Shadcn/ui |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit |
| **Backend** | Node.js, Express, TypeScript |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Validation** | Zod |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/surjeet9700/business-buddy.git
cd business-buddy

# Install frontend dependencies
cd frontend
bun install

# Install backend dependencies
cd ../backend
bun install
```

### Environment Setup

Create `.env` file in the backend directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/business_buddy"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3000
```

### Database Setup

```bash
cd backend

# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# (Optional) Seed the database
bunx prisma db seed
```

### Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
bun dev

# Terminal 2 - Frontend
cd frontend
bun dev
```

Visit `http://localhost:8080` to view the application.

---

## 📁 Project Structure

```
business-buddy/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── config/         # Database config
│   │   └── utils/          # Helpers
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/forms` | List all forms |
| POST | `/api/v1/forms` | Create a form |
| GET | `/api/v1/forms/:id` | Get form details |
| PUT | `/api/v1/forms/:id` | Update a form |
| DELETE | `/api/v1/forms/:id` | Delete a form |
| POST | `/api/v1/forms/:id/duplicate` | Duplicate a form |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/submissions` | List submissions |
| POST | `/api/v1/submissions` | Create submission |
| GET | `/api/v1/submissions/:id` | Get submission details |
| POST | `/api/v1/submissions/:id/approve` | Approve submission |
| POST | `/api/v1/submissions/:id/reject` | Reject submission |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/dashboard` | Get dashboard stats |

---

## 📸 Screenshots

> Add screenshots of your application here

| Dashboard | Form Builder | Submissions |
|-----------|--------------|-------------|
| ![Dashboard](screenshots/dashboard.png) | ![Builder](screenshots/builder.png) | ![Submissions](screenshots/submissions.png) |

---

## 🎯 Key Technical Decisions

1. **React Query for Server State**: Provides caching, background refetching, and optimistic updates out of the box.

2. **Prisma ORM**: Type-safe database access with automatic migrations and excellent TypeScript support.

3. **@dnd-kit for Drag & Drop**: Modern, accessible, and performant drag-and-drop library.

4. **Zod Validation**: Runtime type validation that integrates seamlessly with TypeScript.

5. **Shadcn/ui Components**: Accessible, customizable components built on Radix UI primitives.

---

## 🚧 Future Enhancements

- [ ] JWT Authentication with refresh tokens
- [ ] Role-based access control (RBAC)
- [ ] Email notifications for approvals
- [ ] PDF export for submissions
- [ ] Audit logging
- [ ] API rate limiting

---

## 📄 License

MIT License - feel free to use this project for learning or as a portfolio piece.

---

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

<p align="center">
  Built with ❤️ for enterprise productivity
</p>
