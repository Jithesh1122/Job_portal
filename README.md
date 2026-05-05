# MERN Starter

Full stack MERN project with an Express/Mongoose backend and a React/Vite/Tailwind frontend.

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

The API runs on `http://localhost:5000`.

Resume uploads require Cloudinary credentials in `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

To manually create or update a default admin user, add admin credentials to
`backend/.env`:

```env
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_admin_password
```

Then run:

```bash
npm run create-admin
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The React app runs on `http://localhost:5173`.
