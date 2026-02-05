# Doctor Booking SaaS Platform

A complete production-ready SaaS platform for online doctor booking built with **Next.js**, **Node.js**, and **MongoDB**.

## 🚀 Features

### Patient Features
- Search for doctors by specialty, location, and rating
- Book appointments online
- View upcoming and past appointments
- Manage medical profile

### Doctor Features
- Manage clinic profile and availability
- View and manage appointments
- Track bookings from website vs direct
- EMR (Electronic Medical Records) system
- Performance analytics

### Admin Features
- Approve/reject doctor registrations
- Manage all users and doctors
- View platform analytics
- Configure commission rules

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** (RTL support for Arabic)
- **React Query** / **Axios**
- **Lucide React** (Icons)

### Backend
- **Node.js** with **Express**
- **MongoDB** with **Mongoose**
- **JWT** Authentication
- **bcryptjs** for password hashing

## 📦 Project Structure

```
sass/
├── client/          # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable components
│   │   └── lib/           # Utilities & API client
│   └── package.json
│
└── server/          # Node.js backend
    ├── src/
    │   ├── models/        # Mongoose models
    │   ├── controllers/   # Request handlers
    │   ├── routes/        # API routes
    │   ├── middleware/    # Auth & error handling
    │   └── config/        # DB connection
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/doctor-booking
JWT_SECRET=your_super_secret_jwt_key_here
```

4. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create doctor profile (Auth required)

### Appointments
- `POST /api/appointments` - Book appointment (Auth required)
- `GET /api/appointments/me` - Get patient appointments (Auth required)
- `GET /api/appointments/doctor` - Get doctor appointments (Auth required)

### Patients
- `GET /api/patients/me` - Get patient profile (Auth required)
- `POST /api/patients` - Create/update patient profile (Auth required)

### Admin
- `GET /api/admin/users` - Get all users (Admin only)
- `PUT /api/admin/doctors/:id/approve` - Approve doctor (Admin only)

## 🌐 Pages

### Public Pages
- `/` - Home page with search
- `/search` - Doctor search results
- `/doctor/[id]` - Doctor profile and booking
- `/login` - Login page
- `/signup` - Signup page

### Dashboards
- `/dashboard/patient` - Patient dashboard
- `/dashboard/doctor` - Doctor dashboard
- `/dashboard/admin` - Admin dashboard

## 🎨 Styling

All UI components are built using **Tailwind CSS** with full RTL support for Arabic language. The design system includes:
- Custom color palette
- Responsive layouts
- Dark mode ready (can be enabled)
- Accessible components

## 🔐 Authentication

JWT-based authentication with:
- Access tokens stored in localStorage
- Role-based access control (Patient, Doctor, Admin)
- Protected routes and API endpoints

## 📝 Database Models

- **User** - Base user model with roles
- **Doctor** - Doctor profiles with specialty and pricing
- **Patient** - Patient medical profiles
- **Clinic** - Clinic information and location
- **Appointment** - Booking records with source tracking
- **EMR** - Electronic Medical Records (placeholder)

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
vercel deploy
```

### Backend (Docker)
```bash
cd server
docker build -t doctor-booking-api .
docker run -p 5000:5000 doctor-booking-api
```

## 📄 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please contact the development team.
