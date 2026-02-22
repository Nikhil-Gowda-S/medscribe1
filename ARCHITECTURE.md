# Architecture Documentation

## System Overview

MedScribe is a full-stack web application built with Next.js 14, providing AI-powered medical documentation capabilities. The system follows a modern, component-based architecture with clear separation of concerns.

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication middleware
- **Prisma ORM** - Database abstraction layer
- **PostgreSQL** - Relational database

### AI/ML Services
- **OpenAI GPT-4** - Document generation
- **Web Speech API** - Real-time voice transcription
- **OpenAI Whisper** - Enhanced transcription (available)

### Utilities
- **jsPDF** - PDF generation
- **Zod** - Schema validation
- **bcryptjs** - Password hashing
- **date-fns** - Date manipulation

## Architecture Patterns

### 1. Server Components & Client Components

**Server Components** (default):
- Dashboard pages
- Data fetching
- Authentication checks
- SEO-friendly content

**Client Components** (`'use client'`):
- Interactive UI (forms, buttons)
- Real-time features (voice recording)
- Browser APIs (Speech Recognition)
- State management

### 2. API Route Structure

```
app/api/
├── auth/[...nextauth]/route.ts    # Authentication
├── patients/route.ts               # Patient CRUD
├── consultations/route.ts         # Consultation CRUD
└── documents/
    ├── generate/route.ts          # AI document generation
    └── [id]/pdf/route.ts          # PDF export
```

### 3. Database Schema Design

**User Table**
- Stores doctor accounts
- Hashed passwords
- Role-based access (extensible)

**Patient Table**
- Patient demographics
- Linked to doctor (multi-tenancy)
- Indexed for fast searches

**Consultation Table**
- Links patient and doctor
- Stores transcript
- Status tracking
- Timestamps

**Document Table**
- Generated documents
- Links to consultation
- Template information
- PDF metadata

### 4. Authentication Flow

```
1. User submits credentials
2. NextAuth validates with database
3. JWT token created
4. Session stored in cookie
5. Protected routes check session
6. User data available in components
```

### 5. Voice Transcription Flow

```
1. User clicks "Start Recording"
2. Browser requests microphone permission
3. Web Speech API initialized
4. Continuous recognition started
5. Interim results displayed in real-time
6. Final results appended to transcript
7. User can edit transcript
8. Transcript saved to database
```

### 6. Document Generation Flow

```
1. User selects document type & template
2. Consultation transcript fetched
3. Patient information retrieved
4. Prompt constructed with context
5. OpenAI GPT-4 API called
6. Generated content parsed
7. Document saved to database
8. User can review and download PDF
```

## File Structure

```
medscribe/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication
│   │   ├── patients/             # Patient endpoints
│   │   ├── consultations/        # Consultation endpoints
│   │   └── documents/            # Document endpoints
│   ├── dashboard/                # Dashboard pages
│   │   ├── page.tsx              # Dashboard home
│   │   ├── patients/             # Patient management
│   │   └── consultations/        # Consultation management
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirects)
│   ├── providers.tsx             # Context providers
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Textarea.tsx
│   ├── VoiceRecorder.tsx         # Voice transcription
│   ├── PatientForm.tsx           # Patient form
│   └── DashboardNav.tsx         # Navigation
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Prisma client
│   ├── auth.ts                   # NextAuth config
│   ├── openai.ts                 # OpenAI integration
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed script
├── types/                        # TypeScript types
│   ├── next-auth.d.ts           # NextAuth types
│   └── speech-recognition.d.ts  # Speech API types
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
└── README.md                     # Documentation
```

## Data Flow

### Patient Creation Flow

```
User Input → PatientForm Component
  ↓
API POST /api/patients
  ↓
Validation (Zod)
  ↓
Prisma Create
  ↓
Database Insert
  ↓
Response → UI Update
```

### Consultation Flow

```
Select Patient → New Consultation Page
  ↓
Start Recording → VoiceRecorder Component
  ↓
Web Speech API → Real-time Transcription
  ↓
Save Transcript → API PATCH /api/consultations/[id]
  ↓
Generate Document → API POST /api/documents/generate
  ↓
OpenAI GPT-4 → Document Content
  ↓
Save Document → Database
  ↓
Download PDF → API GET /api/documents/[id]/pdf
```

## Security Architecture

### Authentication
- **JWT-based** sessions
- **bcrypt** password hashing (10 rounds)
- **Secure cookies** (httpOnly, sameSite)
- **CSRF protection** via NextAuth

### Authorization
- **Row-level security** (doctors see only their data)
- **API route protection** (session checks)
- **Server-side validation** (Zod schemas)

### Data Protection
- **Environment variables** for secrets
- **No sensitive data in client**
- **HTTPS required** for production
- **Input sanitization** via Prisma

## Performance Optimizations

### Frontend
- **Server Components** for faster initial load
- **Code splitting** via Next.js
- **Image optimization** (if added)
- **Lazy loading** for heavy components

### Backend
- **Prisma connection pooling**
- **Database indexing** on foreign keys
- **API response caching** (can be added)
- **Efficient queries** (select only needed fields)

### AI/ML
- **Streaming responses** (can be implemented)
- **Prompt optimization** for faster generation
- **Error handling** with retries
- **Rate limiting** (OpenAI handles)

## Scalability Considerations

### Horizontal Scaling
- **Stateless API** routes (scalable)
- **Database connection pooling**
- **CDN** for static assets
- **Load balancing** ready

### Database Scaling
- **Indexed queries**
- **Connection pooling**
- **Read replicas** (can be added)
- **Partitioning** (future)

### AI Service Scaling
- **OpenAI rate limits** handled
- **Queue system** (can be added)
- **Caching** generated documents
- **Batch processing** (future)

## Error Handling

### Client-Side
- **Try-catch** blocks
- **Error boundaries** (can be added)
- **User-friendly messages**
- **Toast notifications**

### Server-Side
- **API error responses**
- **Logging** (console for now)
- **Graceful degradation**
- **Validation errors** returned

### Database
- **Transaction rollback**
- **Foreign key constraints**
- **Unique constraints**
- **Error messages** to client

## Testing Strategy (Future)

### Unit Tests
- Utility functions
- Component logic
- API route handlers

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- User workflows
- Voice transcription
- Document generation

## Monitoring & Logging

### Current
- Console logging
- Error tracking in UI
- Browser DevTools

### Recommended (Future)
- **Sentry** for error tracking
- **Vercel Analytics** for performance
- **Database monitoring**
- **API usage tracking**

## Deployment Architecture

### Development
```
Local Machine
  ├── Next.js Dev Server (Port 3000)
  ├── PostgreSQL (Local)
  └── OpenAI API (External)
```

### Production (Vercel)
```
Vercel Edge Network
  ├── Next.js App (Serverless)
  ├── API Routes (Serverless Functions)
  └── Static Assets (CDN)
        ↓
  External Services
    ├── PostgreSQL (Railway/Supabase)
    └── OpenAI API
```

## Future Enhancements

### Architecture Improvements
- [ ] Redis caching layer
- [ ] Message queue (RabbitMQ/SQS)
- [ ] WebSocket for real-time updates
- [ ] Microservices split (if needed)
- [ ] GraphQL API (optional)

### Feature Additions
- [ ] File upload (audio/images)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)

---

**This architecture is designed for scalability, maintainability, and performance.**
