# QR Menu Editor - Full-Stack Application

A professional full-stack web application for creating, editing, and sharing restaurant menus with QR code generation. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

### Core Menu Editor (All Original Features Preserved)
- ✅ Drag-and-drop menu item positioning
- ✅ Undo/Redo functionality
- ✅ Auto-save to cloud database
- ✅ Table sections with individual sizing
- ✅ Image uploads with advanced adjustments (brightness, contrast, saturation, etc.)
- ✅ Line drawing tool
- ✅ Multi-select editing
- ✅ Extensive font and styling options
- ✅ Column headers customization for double-price items
- ✅ HD image export (print-ready quality)
- ✅ JSON import/export

### New Cloud Features
- 🔐 User authentication (Email/Password + Google OAuth)
- ☁️ Cloud storage for menus and images
- 📱 QR code generation for menu sharing
- 🌐 Public menu viewer pages
- 📊 Dashboard to manage multiple menus
- 🔗 Shareable public URLs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works great!)

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (takes ~2 minutes)

#### 2. Run the SQL Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `lib/supabase/schema.sql` from this project
3. Copy all the SQL code and paste it into the Supabase SQL Editor
4. Click **Run** to create the tables and policies

#### 3. Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name it `menu-images`
4. Make it **Public**
5. Click **Create bucket**

#### 4. Configure Storage Policies

In the Storage section, click on `menu-images` bucket, then go to **Policies** and add:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow public access to view images
CREATE POLICY "Public images are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### 5. Enable Google OAuth (Optional)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Follow the instructions to set up Google OAuth
4. Add your authorized redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

### 2. Project Setup

1. **Clone and Install**
   ```bash
   cd Menu-Editor
   npm install
   ```

2. **Configure Environment Variables**
   
   Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

   Then fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   **Where to find these:**
   - Go to your Supabase project dashboard
   - Click **Settings** → **API**
   - Copy the values:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Menu-Editor/
├── app/
│   ├── api/              # API routes
│   │   ├── menus/        # Menu CRUD operations
│   │   └── upload/       # Image upload
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # User dashboard
│   ├── editor/[id]/      # Menu editor
│   ├── menu/[slug]/      # Public menu viewer
│   └── page.tsx          # Landing page
├── components/           # React components
│   └── MenuEditor.tsx    # Main editor component
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
└── middleware.ts         # Auth middleware
```

## 🎨 Usage

### Creating Your First Menu

1. **Sign Up** - Create an account at `/auth/signup`
2. **Dashboard** - You'll be redirected to your dashboard
3. **New Menu** - Click "Create New Menu"
4. **Edit** - Use the drag-and-drop editor to design your menu
5. **Share** - Generate a QR code and share your menu URL

### Menu Editor Features

- **Add Items**: Click "Add Menu Item" or "Add Table Section"
- **Drag & Drop**: Click and drag items to reposition
- **Styling**: Select items to customize fonts, colors, sizes
- **Images**: Upload food photos with advanced adjustments
- **Export**: Download as HD image or JSON

### Sharing Your Menu

1. Click "Generate QR Code" in the editor
2. Download the QR code image
3. Print it or display it digitally
4. Customers scan to view your menu

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Environment Variables in Vercel

Add the same environment variables from `.env.local` in your Vercel project settings.

## 📝 Database Schema

### Tables

- **menus** - Stores all menu data
  - User ownership with RLS
  - JSONB fields for flexible data storage
  - Automatic timestamps

### Storage

- **menu-images** - Public bucket for menu images
  - User-specific folders
  - RLS policies for security

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User authentication required for editing
- Public menus accessible via unique slugs
- Image uploads scoped to authenticated users

## 🐛 Troubleshooting

### "Unauthorized" errors
- Check that your Supabase credentials are correct in `.env.local`
- Ensure you've run the SQL schema in Supabase
- Verify RLS policies are enabled

### Images not uploading
- Check that the `menu-images` bucket exists
- Verify storage policies are configured
- Ensure bucket is set to public

### Google OAuth not working
- Verify Google provider is enabled in Supabase
- Check redirect URLs are configured correctly
- Ensure you're using HTTPS in production

## 📄 License

MIT License - feel free to use this project for your restaurant or business!

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Need help?** Check the implementation plan in the `brain` folder or create an issue on GitHub.
