leave-management-system/
├── backend/                          # Node.js Backend
│   ├── package.json
│   ├── server.js                     # Main server file
│   └── leave-records.xlsx            # Auto-generated Excel database
│
└── frontend/                         # Angular 18 Frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── leave-form/              # Form Component
    │   │   │   │   ├── leave-form.component.ts
    │   │   │   │   ├── leave-form.component.html
    │   │   │   │   └── leave-form.component.css
    │   │   │   │
    │   │   │   ├── leave-table/             # Table Component with Filtering
    │   │   │   │   ├── leave-table.component.ts
    │   │   │   │   ├── leave-table.component.html
    │   │   │   │   └── leave-table.component.css
    │   │   │   │
    │   │   │   ├── leave-analytics/         # D3 Analytics Dashboard
    │   │   │   │   └── leave-analytics.component.ts
    │   │   │   │
    │   │   │   └── theme-toggle/            # Theme Switch Component
    │   │   │       └── theme-toggle.component.ts
    │   │   │
    │   │   ├── services/
    │   │   │   ├── leave.service.ts         # API Communication Service
    │   │   │   └── theme.service.ts         # Theme Management Service
    │   │   │
    │   │   ├── models/
    │   │   │   └── leave-record.model.ts    # TypeScript Interfaces
    │   │   │
    │   │   ├── app.component.ts             # Root Component
    │   │   ├── app.component.html           # Root Template
    │   │   └── app.component.css            # Root Styles
    │   │
    │   ├── styles.css                       # Global Theme Styles
    │   ├── main.ts                          # Bootstrap Application
    │   └── index.html                       # HTML Entry Point
    │
    ├── package.json                         # Dependencies
    ├── angular.json                         # Angular Configuration
    └── tsconfig.json                        # TypeScript Configuration

┌─────────────────────────────────────────────────────────────┐
│                     APP COMPONENT                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │   LEAVE FORM    │ │   LEAVE TABLE   │ │   ANALYTICS   │ │
│  │                 │ │                 │ │               │ │
│  │ • Employee      │ │ • Scrollable    │ │ • Monthly     │ │
│  │ • Date Range    │ │ • Date Filter   │ │ • Overall     │ │
│  │ • Leave Type    │ │ • Month Groups  │ │ • Employee    │ │
│  │ • Comments      │ │ • CRUD Actions  │ │ • D3 Charts   │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   SERVICES LAYER                        │ │
│  │  ┌─────────────────┐     ┌─────────────────────────────┐ │ │
│  │  │  LEAVE SERVICE  │     │      THEME SERVICE          │ │ │
│  │  │ • HTTP Client   │     │ • Dark/Light Toggle         │ │ │
│  │  │ • CRUD Methods  │     │ • Persistence               │ │ │
│  │  │ • Data Stream   │     │ • CSS Variables             │ │ │
│  │  └─────────────────┘     └─────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   API ROUTES                            │ │
│  │  GET    /api/leave-records        (Read All)            │ │
│  │  POST   /api/leave-records        (Create)              │ │
│  │  PUT    /api/leave-records/:id/cancel (Cancel)          │ │
│  │  DELETE /api/leave-records/:id    (Remove)              │ │
│  │  GET    /api/health               (Health Check)        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 EXCEL OPERATIONS                        │ │
│  │  • Auto-create Excel file if missing                    │ │
│  │  • Read records from Excel                              │ │
│  │  • Write records to Excel                               │ │
│  │  • URL-safe ID generation                               │ │
│  │  • Error handling & logging                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 EXCEL DATABASE                          │ │
│  │  Columns: ID | EmployeeName | LeaveDate | Status |      │ │
│  │           LeaveType | Comment                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐    HTTP/REST     ┌─────────────┐    XLSX Lib    ┌─────────────┐
│   ANGULAR   │ ←─────────────→  │   NODE.JS   │ ←─────────────→ │    EXCEL    │
│  FRONTEND   │                  │   BACKEND   │                 │    FILE     │
│             │                  │             │                 │             │
│ • Components│  JSON Requests   │ • Express   │   Read/Write    │ • Persistent│
│ • Services  │  JSON Responses  │ • XLSX      │   Operations    │ • Columns   │
│ • D3 Charts │                  │ • CORS      │                 │ • Auto-gen  │
│ • Themes    │                  │ • Error     │                 │ • Formulas  │
└─────────────┘                  └─────────────┘                 └─────────────┘


# Start the backend server
npm run dev
# Server will run on http://localhost:3001

# Start the frontend server
ng serve
# Server will run on http://localhost:4200